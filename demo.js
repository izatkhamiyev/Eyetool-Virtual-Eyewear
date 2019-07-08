
if(typeof exports == "undefined"){
	exports = this;
}

let THREECAMERA;
var THREEFACEOBJ3D, THREEFACEOBJ3DPIVOTED, VACANTIMG;
var LEFTEARTEMPLE, RIGHTEARTEMPLE;
var ISDETECTED=false, ISLOADED=false;


var SETTINGS={
    rotationOffsetX: 0, //negative -> look upper. in radians
    cameraFOV: 40,      //in degrees, 3D camera FOV
    pivotOffsetYZ: [0, 0], //XYZ of the distance between the center of the cube and the pivot
    detectionThreshold: 0.5, //sensibility, between 0 and 1. Less -> more sensitive
    detectionHysteresis: 0.1,
    scale: 0.6 //scale of the 3D cube
};

// callback : launched if a face is detected or lost. TODO : add a cool particle effect WoW !
function detect_callback(faceIndex, isDetected) {
    if (isDetected) {
        console.log('INFO in detect_callback() : DETECTED');
    } else {
        console.log('INFO in detect_callback() : LOST');
    }
}

// build the 3D. called once when Jeeliz Face Filter is OK
function init_threeScene(spec, pathToModel) {
    
    const threeStuffs = THREE.JeelizHelper.init(spec, detect_callback);
    
    THREEFACEOBJ3D=new THREE.Object3D();
    THREEFACEOBJ3D.frustumCulled=false;
    THREEFACEOBJ3DPIVOTED=new THREE.Object3D();
    THREEFACEOBJ3DPIVOTED.frustumCulled=false;
    THREEFACEOBJ3DPIVOTED.position.set(0, -SETTINGS.pivotOffsetYZ[0], -SETTINGS.pivotOffsetYZ[1]);
    THREEFACEOBJ3DPIVOTED.scale.set(SETTINGS.scale, SETTINGS.scale, SETTINGS.scale);
    THREEFACEOBJ3D.add(THREEFACEOBJ3DPIVOTED);
    
    //get the scene from A-Frame :
    threeStuffs.faceObject.add(THREEFACEOBJ3D);
    //  // CREATE A CUBE
    // const cubeGeometry = new THREE.BoxGeometry(1,1,1);
    // const cubeMaterial = new THREE.MeshNormalMaterial();
    // const threeCube = new THREE.Mesh(cubeGeometry, cubeMaterial);
    // threeCube.frustumCulled = false;
    // threeStuffs.faceObject.add(threeCube)
    var mtlLoader = new THREE.MTLLoader();
    var loader = new THREE.OBJLoader();

    // load a resource
    mtlLoader.load(
        pathToModel.concat('.mtl'),
        function(materials){
            materials.preload();
            var objLoader = new THREE.OBJLoader();
            objLoader.setMaterials(materials);
            objLoader.load(
                // resource URL
                pathToModel.concat('.obj'),
                // called when resource is loaded
                function ( object ) {
                    // object.position.set(-0.5, -0.5, -0.5);
                    let i = 0;
                    for(i = 0; i < object.children.length; i++){
                        var firstLetter = object.children[i].name.charAt(0);
                        
                        if (firstLetter == 'l'){
                            LEFTEARTEMPLE = object.children[i];
                        }
                        else if(firstLetter == 'r'){
                            RIGHTEARTEMPLE = object.children[i];
                        }
                    }
                    THREEFACEOBJ3DPIVOTED.add( object );
                    
                },
                // called when loading is in progresses
                function ( xhr ) {
        
                    console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );
        
                },
                // called when loading has errors
                function ( error ) {
        
                    console.log( 'An error happened' );
        
                }
            );
        }
    )
    
    //LOAD VACANT FACE

    VACANTIMG = new THREE.Mesh(threeStuffs.videoMesh.geometry,  create_mat2d(new THREE.TextureLoader().load('./assets/man_face.png'), true))
    VACANTIMG.renderOrder = 999; // render last
    VACANTIMG.frustumCulled = false;
    threeStuffs.scene.add(VACANTIMG);

    
    //CREATE THE CAMERA
    const aspecRatio=spec.canvasElement.width / spec.canvasElement.height;
    THREECAMERA=new THREE.PerspectiveCamera(20, aspecRatio, 0.1, 100);


    const ambient = new THREE.AmbientLight(0xffffff, 1);
    threeStuffs.scene.add(ambient)

    var dirLight = new THREE.DirectionalLight(0xffffff);
    dirLight.position.set(200, 200, 200);

    threeStuffs.scene.add(dirLight)
} // end init_threeScene()

//launched by body.onload() :
function main(pathToModel){
    console.log(pathToModel);
    JeelizResizer.size_canvas({
        canvasId: 'jeeFaceFilterCanvas',
        callback: function(isError, bestVideoSettings){
            init_faceFilter(bestVideoSettings, pathToModel);
        }
    })
} //end main()

function create_mat2d(threeTexture, isTransparent){ //MT216 : we put the creation of the video material in a func because we will also use it for the frame
    return new THREE.RawShaderMaterial({
        depthWrite: false,
        depthTest: false,
        transparent: isTransparent,
        vertexShader: "attribute vec2 position;\n\
            varying vec2 vUV;\n\
            void main(void){\n\
                gl_Position=vec4(position, 0., 1.);\n\
                vUV=0.5+0.5*position;\n\
            }",
        fragmentShader: "precision lowp float;\n\
            uniform sampler2D samplerVideo;\n\
            varying vec2 vUV;\n\
            void main(void){\n\
                gl_FragColor=texture2D(samplerVideo, vUV);\n\
            }",
         uniforms:{
            samplerVideo: { value: threeTexture }
         }
    });
}



function init_faceFilter(videoSettings, pathToModel){
    console.log(pathToModel)
    JEEFACEFILTERAPI.init({
        followZRot: true,
        canvasId: 'jeeFaceFilterCanvas',
        NNCpath: './dist/', // root of NNC.json file
        maxFacesDetected: 1,
        callbackReady: function(errCode, spec){
          if (errCode){
            console.log('AN ERROR HAPPENS. ERR =', errCode);
            return;
          }

          console.log('INFO : JEEFACEFILTERAPI IS READY');
          init_threeScene(spec, pathToModel);
        }, //end callbackReady()

        //called at each render iteration (drawing loop) :
        callbackTrack: function(detectState){
            if (ISDETECTED && detectState.detected<SETTINGS.detectionThreshold-SETTINGS.detectionHysteresis){
                //DETECTION LOST
                detect_callback(false);
                ISDETECTED=false;
            } else if (!ISDETECTED && detectState.detected>SETTINGS.detectionThreshold+SETTINGS.detectionHysteresis){
                //FACE DETECTED 
                detect_callback(true);
                ISDETECTED=true;
            }
            

            if (ISDETECTED){
                THREEFACEOBJ3D.visible = true;
                VACANTIMG.visible = false;
                //move the cube in order to fit the head
                var tanFOV=Math.tan(THREECAMERA.aspect*THREECAMERA.fov*Math.PI/360); //tan(FOV/2), in radians
                var W=detectState.s;  //relative width of the detection window (1-> whole width of the detection window)
                var D=1/(2*W*tanFOV); //distance between the front face of the cube and the camera
                
                //coords in 2D of the center of the detection window in the viewport :
                var xv=detectState.x;
                var yv=detectState.y;
                
                //coords in 3D of the center of the cube (in the view coordinates system)
                var z=-D;   // minus because view coordinate system Z goes backward. -0.5 because z is the coord of the center of the cube (not the front face)
                var x=xv*D*tanFOV;
                var y=yv*D*tanFOV/THREECAMERA.aspect;
                var rx = detectState.rx, ry = detectState.ry, rz = detectState.rz;
                //move and rotate the cube
                // THREEFACEOBJ3D.position.set(x, y+SETTINGS.pivotOffsetYZ[0],z+SETTINGS.pivotOffsetYZ[1]);
                THREEFACEOBJ3D.rotation.set((rx+SETTINGS.rotationOffsetX)  / 10, ry / 10, rz / 10, "XYZ");

                LEFTEARTEMPLE.visible = false;
                RIGHTEARTEMPLE.visible = false;
                if(ry > -0.1){
                    RIGHTEARTEMPLE.visible = true;
                }
                if(ry < 0.1){
                    LEFTEARTEMPLE.visible = true;
                }
            }
            else{
                THREEFACEOBJ3D.visible = false;
                VACANTIMG.visible = true;
            }
            
            THREE.JeelizHelper.render(detectState, THREECAMERA);
        } //end callbackTrack()
    }); //end JEEFACEFILTERAPI.init call
} // end main()

