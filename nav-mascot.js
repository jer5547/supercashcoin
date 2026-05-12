// SCC voxel mascot for the navbar.
// Requires THREE.js already on the page (your hero scene already loads r128).
// Hook it up to <canvas id="nav-mascot"></canvas>.
(function(){
  function init(){
    var canvas = document.getElementById('nav-mascot');
    if(!canvas || !window.THREE) return;

    var K = 0x0a0a0a, W = 0xffffff, OR = 0xff8a1f;

    function vox(x, y, z, color, depth){
      var m = new THREE.Mesh(
        new THREE.BoxGeometry(1, 1, depth),
        new THREE.MeshStandardMaterial({color: color, roughness: 0.55, flatShading: true})
      );
      m.position.set(x, y, z);
      return m;
    }

    function buildSCC(){
      var g = new THREE.Group();
      // Ears
      g.add(vox(-7, 11, 0, OR, 2)); g.add(vox(-6, 11, 0, OR, 2));
      g.add(vox( 6, 11, 0, OR, 2)); g.add(vox( 7, 11, 0, OR, 2));
      g.add(vox(-7, 10, 0, OR, 2)); g.add(vox(-6, 10, 0, OR, 2)); g.add(vox(-5, 10, 0, OR, 2));
      g.add(vox( 5, 10, 0, OR, 2)); g.add(vox( 6, 10, 0, OR, 2)); g.add(vox( 7, 10, 0, OR, 2));
      // Top bar
      for(var x=-7; x<=7; x++) for(var y=8; y<=9; y++) g.add(vox(x, y, 0, OR, 2));
      // Sunglasses
      for(var x2=-6; x2<=6; x2++) for(var y2=4; y2<=7; y2++) g.add(vox(x2, y2, 0, K, 2));
      // Lens highlights
      g.add(vox(-4, 5, 0, W, 2)); g.add(vox(-3, 5, 0, W, 2));
      g.add(vox( 3, 5, 0, W, 2)); g.add(vox( 4, 5, 0, W, 2));
      // Lower face
      for(var x3=-7; x3<=7; x3++) for(var y3=-2; y3<=3; y3++) g.add(vox(x3, y3, 0, OR, 2));
      for(var x4=-6; x4<=6; x4++) g.add(vox(x4, -3, 0, OR, 2));
      // Nostrils
      g.add(vox(-2, 2, 1.1, K, 0.4));
      g.add(vox( 2, 2, 1.1, K, 0.4));
      // Smirk: hook + shortened bar
      g.add(vox(4,  0, 1.1, K, 0.4));
      g.add(vox(4, -1, 1.1, K, 0.4));
      for(var x5=-3; x5<=3; x5++) g.add(vox(x5, -2, 1.1, K, 0.4));
      return g;
    }

    var renderer = new THREE.WebGLRenderer({canvas: canvas, antialias: true, alpha: true});
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(35, 1, 0.1, 200);
    camera.position.set(0, 0, 26);
    camera.lookAt(0, 4, 0);

    scene.add(new THREE.AmbientLight(0xffffff, 0.55));
    var key = new THREE.DirectionalLight(0xffffff, 0.9);
    key.position.set(8, 18, 22); scene.add(key);
    var fill = new THREE.DirectionalLight(0xfff0d0, 0.35);
    fill.position.set(-15, 8, 8); scene.add(fill);
    var rim = new THREE.DirectionalLight(0xfff0f0, 0.2);
    rim.position.set(0, -5, -15); scene.add(rim);

    var character = buildSCC();
    scene.add(character);

    function resize(){
      var r = canvas.getBoundingClientRect();
      if(!r.width) return;
      renderer.setSize(r.width, r.height, false);
      camera.aspect = r.width / r.height;
      camera.updateProjectionMatrix();
    }
    window.addEventListener('resize', resize);
    resize();

    // Animation — idle bob/sway, faster spin on hover
    var phase = Math.random() * Math.PI * 2;
    var hover = false;
    canvas.addEventListener('mouseenter', function(){ hover = true; });
    canvas.addEventListener('mouseleave', function(){ hover = false; });

    function tick(){
      var t = performance.now() / 1000 + phase;
      character.rotation.y = hover ? Math.sin(t * 3) * 0.30 : Math.sin(t * 1.2) * 0.06;
      character.rotation.x = Math.sin(t * 1.6) * 0.03;
      character.position.y = Math.cos(t * 1.4) * 0.25;
      renderer.render(scene, camera);
      requestAnimationFrame(tick);
    }
    tick();
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

(function(){
  function initNav(){
    var btn = document.querySelector('.nav-toggle');
    var links = document.querySelector('.nav-links');
    if(!btn || !links) return;
    btn.addEventListener('click', function(){
      var expanded = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', !expanded);
      links.classList.toggle('open');
    });
    links.querySelectorAll('a').forEach(function(a){
      a.addEventListener('click', function(){
        btn.setAttribute('aria-expanded', 'false');
        links.classList.remove('open');
      });
    });
  }
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', initNav);
  } else {
    initNav();
  }
})();