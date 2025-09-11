window.CreoDonut = function(el, slices){
    const ctx = el.getContext('2d');
    const cx = el.width/2, cy = el.height/2, r = Math.min(cx,cy)-6;
    const total = slices.reduce((a,b)=>a+b.v,0) || 1;
    let a0 = -Math.PI/2;
    ctx.clearRect(0,0,el.width,el.height);
    slices.forEach(s=>{
      const a1 = a0 + (s.v/total)*Math.PI*2;
      ctx.beginPath();
      ctx.moveTo(cx,cy);
      ctx.arc(cx,cy,r,a0,a1);
      ctx.closePath();
      ctx.fillStyle = s.c;
      ctx.fill();
      a0 = a1;
    });
    // inner hole
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(cx,cy,r*0.62,0,Math.PI*2);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
  };
  