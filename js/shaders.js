// All visuals are procedural — no image textures.

export const noise = /* glsl */ `
vec3 mod289(vec3 x){return x-floor(x*(1./289.))*289.;}
vec4 mod289(vec4 x){return x-floor(x*(1./289.))*289.;}
vec4 permute(vec4 x){return mod289(((x*34.)+1.)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1./6.,1./3.);const vec4 D=vec4(0.,.5,1.,2.);
  vec3 i=floor(v+dot(v,C.yyy));vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz);vec3 l=1.-g;vec3 i1=min(g.xyz,l.zxy);vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx;vec3 x2=x0-i2+C.yyy;vec3 x3=x0-D.yyy;
  i=mod289(i);
  vec4 p=permute(permute(permute(i.z+vec4(0.,i1.z,i2.z,1.))+i.y+vec4(0.,i1.y,i2.y,1.))+i.x+vec4(0.,i1.x,i2.x,1.));
  float n_=.142857142857;vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.*floor(p*ns.z*ns.z);
  vec4 x_=floor(j*ns.z);vec4 y_=floor(j-7.*x_);
  vec4 x=x_*ns.x+ns.yyyy;vec4 y=y_*ns.x+ns.yyyy;vec4 h=1.-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy);vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.+1.;vec4 s1=floor(b1)*2.+1.;vec4 sh=-step(h,vec4(0.));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x);vec3 p1=vec3(a0.zw,h.y);vec3 p2=vec3(a1.xy,h.z);vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
  vec4 m=max(.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.);m=m*m;
  return 42.*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}
float fbm(vec3 p){float f=0.,a=.5;for(int i=0;i<5;i++){f+=a*snoise(p);p*=2.02;a*=.5;}return f;}
float fbm3(vec3 p){float f=0.,a=.5;for(int i=0;i<3;i++){f+=a*snoise(p);p*=2.03;a*=.5;}return f;}
`;

// Shared planet vertex shader: object-space position for noise (rotates with the mesh),
// world-space normal/position for lighting.
export const planetVert = /* glsl */ `
varying vec3 vObj; varying vec3 vN; varying vec3 vWPos;
void main(){
  vObj = normalize(position);
  vN = normalize(mat3(modelMatrix) * normal);
  vec4 w = modelMatrix * vec4(position, 1.);
  vWPos = w.xyz;
  gl_Position = projectionMatrix * viewMatrix * w;
}`;

const planetHead = /* glsl */ `
uniform vec3 uSun; uniform float uTime;
varying vec3 vObj; varying vec3 vN; varying vec3 vWPos;
${noise}
`;

export const earthFrag = planetHead + /* glsl */ `
void main(){
  vec3 p = vObj;
  float detail = fbm3(p*8.);
  float h = fbm(p*1.7 + vec3(3.1)) + detail*.12;
  float land = smoothstep(.03,.07,h);
  float lat = abs(p.y);
  vec3 ocean = mix(vec3(.004,.025,.1), vec3(.02,.15,.32), smoothstep(-.3,.05,h));
  float dry = smoothstep(.35,.75, fbm3(p*3.+7.)*.5+.5 + (1.-lat)*.25 - .1);
  vec3 landC = mix(vec3(.05,.14,.04), vec3(.4,.3,.16), dry);
  landC = mix(landC, vec3(.22,.18,.14), smoothstep(.22,.4,h));
  float ice = smoothstep(.74,.8, lat + detail*.12);
  vec3 col = mix(ocean, landC, land);
  col = mix(col, vec3(.85,.9,.96), ice);

  vec3 N = normalize(vN), V = normalize(cameraPosition - vWPos), L = normalize(uSun);
  float ndl = dot(N,L);
  float day = smoothstep(-.1,.35,ndl);
  vec3 H = normalize(L+V);
  float spec = pow(max(dot(N,H),0.),70.) * (1.-land) * (1.-ice) * day;
  vec3 lit = col*day*1.15 + vec3(1.,.9,.75)*spec*1.2;

  float city = smoothstep(.62,.95, snoise(p*48.)*.5+.5) * smoothstep(.45,.7, fbm3(p*5.)*.5+.5+.15);
  lit += vec3(1.,.6,.24) * city * land * (1.-ice) * (1.-smoothstep(-.25,.05,ndl)) * 2.2;

  float fres = pow(1.-max(dot(N,V),0.),3.);
  lit += vec3(.25,.55,1.) * fres * smoothstep(-.2,.5,ndl) * .9;
  gl_FragColor = vec4(lit,1.);
}`;

export const cloudFrag = planetHead + /* glsl */ `
void main(){
  vec3 p = vObj;
  float c = fbm(p*2.4 + vec3(uTime*.012, 0., uTime*.007));
  c = smoothstep(.05,.5, c + .12*fbm3(p*11.));
  float day = smoothstep(-.1,.4, dot(normalize(vN), normalize(uSun)));
  gl_FragColor = vec4(vec3(.92,.95,1.)*day*.95, c*.72);
}`;

export const moonFrag = planetHead + /* glsl */ `
void main(){
  vec3 p = vObj;
  float n = fbm(p*2.2);
  float mare = smoothstep(0.,.3, fbm3(p*1.3+2.));
  float c1 = snoise(p*11.), c2 = snoise(p*29.+5.);
  float cr = smoothstep(.45,.6,c1) - smoothstep(.3,.45,c1)*.35;
  float cr2 = smoothstep(.5,.65,c2) - smoothstep(.35,.5,c2)*.35;
  vec3 col = mix(vec3(.42), vec3(.2), mare) * (.85+.3*n) * (1.-cr*.16-cr2*.1);
  vec3 N = normalize(vN);
  float day = smoothstep(-.02,.3, dot(N, normalize(uSun)));
  gl_FragColor = vec4(col*day*1.15 + vec3(.004), 1.);
}`;

export const marsFrag = planetHead + /* glsl */ `
void main(){
  vec3 p = vObj;
  float n = fbm(p*2.);
  float d = fbm3(p*7.);
  vec3 col = mix(vec3(.28,.09,.04), vec3(.62,.25,.09), smoothstep(-.3,.35,n));
  col = mix(col, vec3(.7,.4,.22), smoothstep(.25,.6,d)*.25);
  col = mix(col, vec3(.92,.88,.86), smoothstep(.86,.9, abs(p.y)+d*.05));
  vec3 N = normalize(vN), V = normalize(cameraPosition - vWPos);
  float ndl = dot(N, normalize(uSun));
  vec3 lit = col*smoothstep(-.08,.4,ndl)*1.1;
  lit += vec3(1.,.5,.3)*pow(1.-max(dot(N,V),0.),3.)*smoothstep(-.2,.5,ndl)*.7;
  gl_FragColor = vec4(lit,1.);
}`;

export const gasFrag = planetHead + /* glsl */ `
uniform vec3 uC1, uC2, uC3, uC4; uniform float uBands, uTurb, uSpot; uniform vec3 uRim;
void main(){
  vec3 p = vObj;
  float warp = fbm(vec3(p.x*2., p.y*7., p.z*2.) + vec3(0.,0.,uTime*.015)) * uTurb;
  float b = p.y*uBands + warp;
  vec3 col = mix(uC1, uC2, sin(b)*.5+.5);
  col = mix(col, uC3, (sin(b*2.3+1.7)*.5+.5)*.55);
  col = mix(col, uC4, smoothstep(.55,1., sin(b*.7+3.)*.5+.5)*.6);
  if (uSpot > 0.) {
    vec3 sc = normalize(vec3(.85,-.36,.4));
    vec3 q = p - sc;
    float d = length(q*vec3(1.,2.,1.)) + fbm3(p*14.)*.03;
    float s = 1.-smoothstep(.1,.2,d);
    col = mix(col, vec3(.6,.19,.08), s*uSpot);
    col = mix(col, vec3(.85,.55,.4), (1.-smoothstep(.2,.26,d))*(1.-s)*.4*uSpot);
  }
  vec3 N = normalize(vN), V = normalize(cameraPosition - vWPos);
  float ndl = dot(N, normalize(uSun));
  float limb = mix(.55,1., pow(max(dot(N,V),0.),.45));
  vec3 lit = col*smoothstep(-.06,.5,ndl)*limb*1.15;
  lit += uRim*pow(1.-max(dot(N,V),0.),4.)*smoothstep(-.2,.5,ndl);
  gl_FragColor = vec4(lit,1.);
}`;

// Halo: brightness from how close the view ray passes to the planet surface.
export const atmoVert = /* glsl */ `
varying vec3 vWPos;
void main(){ vec4 w = modelMatrix*vec4(position,1.); vWPos = w.xyz; gl_Position = projectionMatrix*viewMatrix*w; }`;
export const atmoFrag = /* glsl */ `
uniform vec3 uSun, uCenter, uColor; uniform float uRp, uRa, uIntensity;
varying vec3 vWPos;
void main(){
  vec3 D = normalize(vWPos - cameraPosition);
  vec3 oc = uCenter - cameraPosition;
  float b = length(oc - D*dot(oc,D));
  float g = clamp((uRa-b)/(uRa-uRp), 0., 1.);
  g = pow(g, 2.6);
  vec3 sp = normalize(cameraPosition + D*dot(oc,D) - uCenter);
  float day = smoothstep(-.35,.6, dot(sp, normalize(uSun)));
  gl_FragColor = vec4(uColor*g*(.08+day)*uIntensity, 1.);
}`;

export const ringVert = /* glsl */ `
varying vec3 vLocal; varying vec3 vWPos;
void main(){ vLocal = position; vec4 w = modelMatrix*vec4(position,1.); vWPos = w.xyz; gl_Position = projectionMatrix*viewMatrix*w; }`;
export const ringFrag = /* glsl */ `
uniform vec3 uSun, uPlanet; uniform float uPR, uIn, uOut;
varying vec3 vLocal; varying vec3 vWPos;
${noise}
void main(){
  float r = length(vLocal.xy);
  float t = (r-uIn)/(uOut-uIn);
  float bands = snoise(vec3(t*38.,0.,0.))*.5+.5;
  float fine = snoise(vec3(t*190.,1.,0.))*.5+.5;
  float a = smoothstep(0.,.04,t)*(1.-smoothstep(.95,1.,t));
  a *= (.3+.7*bands)*(.65+.35*fine);
  a *= smoothstep(.012,.028, abs(t-.63));           // Cassini division
  a *= mix(.45,1., smoothstep(0.,.25,t));            // faint C ring
  vec3 col = mix(vec3(.7,.6,.46), vec3(.98,.9,.74), bands);
  vec3 L = normalize(uSun);
  vec3 oc = uPlanet - vWPos;
  float proj = dot(oc,L);
  float d = length(oc - L*proj);
  float sh = proj > 0. ? mix(.06, 1., smoothstep(uPR*.96, uPR*1.04, d)) : 1.;
  gl_FragColor = vec4(col*sh*1.05, a*.92);
}`;

export const skyVert = /* glsl */ `
varying vec3 vDir;
void main(){ vDir = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }`;
export const skyFrag = /* glsl */ `
uniform float uTime;
varying vec3 vDir;
${noise}
void main(){
  vec3 d = normalize(vDir);
  vec3 bandN = normalize(vec3(.3,1.,.25));
  float band = exp(-pow(dot(d,bandN)*3.2, 2.));
  float n = fbm(d*2.3 + 4.);
  float n2 = fbm3(d*5.5 - 2.);
  vec3 violet = vec3(.2,.06,.34), teal = vec3(.02,.16,.24), rose = vec3(.3,.07,.12);
  vec3 col = mix(violet, teal, smoothstep(-.3,.4,n));
  col = mix(col, rose, smoothstep(.2,.6,n2)*.5);
  float dens = smoothstep(-.15,.6,n)*.55 + band*(.5+.5*n2);
  float dust = smoothstep(.1,.5, fbm3(d*9.))*band;
  col *= dens*.16;
  col = mix(col, col*.25, dust);
  col += vec3(.9,.8,1.)*band*.018;
  gl_FragColor = vec4(col,1.);
}`;

export const starVert = /* glsl */ `
attribute float aSize; attribute float aPhase; attribute vec3 aColor;
uniform float uTime, uPR;
varying vec3 vColor; varying float vTw;
void main(){
  vColor = aColor;
  vTw = .65 + .35*sin(uTime*(1.+aPhase*2.) + aPhase*40.);
  vec4 mv = modelViewMatrix*vec4(position,1.);
  gl_PointSize = aSize*uPR;
  gl_Position = projectionMatrix*mv;
}`;
export const starFrag = /* glsl */ `
varying vec3 vColor; varying float vTw;
void main(){
  float d = length(gl_PointCoord-.5);
  float core = smoothstep(.5,0.,d);
  core = pow(core, 2.2);
  gl_FragColor = vec4(vColor*core*vTw, 1.);
}`;

// Warp streaks: line segments in camera space, the tail vertex stretched along -Z by velocity.
export const streakVert = /* glsl */ `
attribute float aTail; attribute float aSeed;
uniform float uTravel, uStretch, uDepth;
varying float vA;
void main(){
  vec3 p = position;
  p.z = -mod(-p.z - uTravel, uDepth);
  p.z -= aTail*uStretch*(1.+aSeed);
  vA = (1.-aTail*.9) * smoothstep(uDepth, uDepth*.6, -p.z) * smoothstep(0., 8., -p.z);
  gl_Position = projectionMatrix*modelViewMatrix*vec4(p,1.);
}`;
export const streakFrag = /* glsl */ `
uniform float uOpacity; uniform vec3 uColor;
varying float vA;
void main(){ gl_FragColor = vec4(uColor*vA*uOpacity, 1.); }`;

// Ray-marched Schwarzschild black hole as a post pass. Photon paths are integrated with
// the classic a = -1.5·h²·r̂/r⁴ geodesic trick (rs = 1). Escaped rays sample the rendered
// scene where their final direction lands on screen, else a procedural sky.
export const BlackHoleShader = {
  uniforms: {
    tDiffuse: { value: null },
    uCamPos: { value: null }, uInvProj: { value: null }, uCamWorld: { value: null }, uViewProj: { value: null },
    uBH: { value: null }, uS: { value: 2.5 }, uTilt: { value: null }, uTime: { value: 0 }, uOn: { value: 0 }, uSteps: { value: 260 },
  },
  vertexShader: /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
  fragmentShader: /* glsl */ `
  uniform sampler2D tDiffuse;
  uniform vec3 uCamPos, uBH; uniform mat4 uInvProj, uCamWorld, uViewProj; uniform mat3 uTilt;
  uniform float uS, uTime, uOn; uniform int uSteps;
  varying vec2 vUv;
  ${noise}
  vec3 proceduralSky(vec3 d){
    vec3 p = d*190.; vec3 c = floor(p); vec3 f = fract(p)-.5;
    float h = fract(sin(dot(c, vec3(127.1,311.7,74.7)))*43758.5453);
    float s = step(.968,h) * smoothstep(.22,0.,length(f)) * (h-.968)*40.;
    return vec3(s) + vec3(.03,.012,.05)*(fbm3(d*3.)*.5+.6);
  }
  vec3 sampleBg(vec3 dir){
    vec3 sky = proceduralSky(dir);
    vec4 clip = uViewProj*vec4(uCamPos + dir*1000., 1.);
    if (clip.w <= 0.) return sky;
    vec2 uv = clip.xy/clip.w*.5+.5;
    vec2 e = min(uv, 1.-uv);
    float fade = clamp(min(e.x,e.y)*18., 0., 1.);
    return mix(sky, texture2D(tDiffuse, clamp(uv,0.,1.)).rgb, fade);
  }
  vec4 disk(vec3 hp, float r, vec3 rd){
    float ang = uTime*1.4/pow(r,1.5);
    float c = cos(ang), s = sin(ang);
    vec2 q = mat2(c,-s,s,c)*hp.xz;
    float n = fbm3(vec3(q*.8, r*1.6))*.5+.5;
    float streak = snoise(vec3(q*2.6, r*7.))*.5+.5;
    float x = (r-2.6)/(12.-2.6);
    float dens = smoothstep(0.,.05,x)*(1.-smoothstep(.5,1.,x));
    dens *= mix(.35,1.25,n)*mix(.65,1.15,streak);
    vec3 col = mix(vec3(1.,.93,.82), vec3(1.,.52,.16), smoothstep(0.,.35,x));
    col = mix(col, vec3(.65,.13,.03), smoothstep(.35,1.,x));
    vec3 tang = normalize(vec3(hp.z,0.,-hp.x));
    float dop = 1. + .55*dot(tang, -rd);
    float bright = pow(max(dop,.15), 3.) * (1.5*pow(1.-x,2.)+.12);
    float grav = sqrt(max(1.-1./r, 0.));
    return vec4(col*bright*grav, clamp(dens,0.,1.)*.96);
  }
  void main(){
    vec4 base = texture2D(tDiffuse, vUv);
    if (uOn < .001) { gl_FragColor = base; return; }
    vec2 ndc = vUv*2.-1.;
    vec4 vv = uInvProj*vec4(ndc,1.,1.); vv /= vv.w;
    vec3 dir = normalize((uCamWorld*vec4(vv.xyz,0.)).xyz);
    vec3 oc = uBH - uCamPos;
    float tca = dot(oc, dir);
    float camR = length(oc)/uS;
    if (tca < 0. && camR > 14.) { gl_FragColor = base; return; }
    vec3 closest = uCamPos + dir*max(tca,0.);
    float b = length(closest-uBH)/uS;
    vec3 res;
    if (b > 22.) {
      if (b > 300.) { gl_FragColor = base; return; }
      vec3 n = normalize(closest-uBH);
      res = sampleBg(normalize(dir - n*(2./b)));   // weak-field deflection
    } else {
      mat3 M = uTilt;
      vec3 p = M*((uCamPos-uBH)/uS);
      vec3 v = M*dir;
      float R0 = 40.;
      if (camR > R0) { float tc = dot(-p,v); float d2 = dot(p,p)-tc*tc; p += v*(tc - sqrt(max(R0*R0-d2,0.))); }
      vec3 hv = cross(p,v); float h2 = dot(hv,hv);
      vec3 col = vec3(0.); float alpha = 0.; bool captured = false;
      float rEsc = max(R0, camR) + 1.;
      for (int i = 0; i < 400; i++) {
        if (i >= uSteps) break;
        float r = length(p);
        float dt = clamp(.055*r, .012, 2.5);
        vec3 v2 = v - 1.5*h2*p/pow(r,5.)*dt;
        vec3 p2 = p + v2*dt;
        if (p.y*p2.y < 0.) {
          vec3 hp = mix(p, p2, p.y/(p.y-p2.y));
          float rh = length(hp.xz);
          if (rh > 2.6 && rh < 12.) {
            vec4 dc = disk(hp, rh, normalize(v2));
            col += (1.-alpha)*dc.rgb*dc.a; alpha += (1.-alpha)*dc.a;
          }
        }
        p = p2; v = v2;
        if (length(p) < 1.) { captured = true; break; }
        if (alpha > .985) break;
        if (length(p) > rEsc && dot(p,v) > 0.) break;
      }
      vec3 bg = captured ? vec3(0.) : sampleBg(normalize(transpose(M)*v));
      res = col + (1.-alpha)*bg;
    }
    gl_FragColor = vec4(mix(base.rgb, res, uOn), 1.);
  }`,
};

// Runs after OutputPass, in display space: chromatic aberration, vignette, grain.
export const FilmShader = {
  uniforms: { tDiffuse: { value: null }, uTime: { value: 0 }, uCA: { value: 0 }, uGrain: { value: .045 }, uVig: { value: .55 }, uFade: { value: 1 } },
  vertexShader: /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
  fragmentShader: /* glsl */ `
  uniform sampler2D tDiffuse; uniform float uTime, uCA, uGrain, uVig, uFade;
  varying vec2 vUv;
  void main(){
    vec2 d = vUv-.5;
    float ca = uCA*(.4+length(d)*2.);
    vec3 c;
    c.r = texture2D(tDiffuse, vUv - d*ca).r;
    c.g = texture2D(tDiffuse, vUv).g;
    c.b = texture2D(tDiffuse, vUv + d*ca).b;
    c *= 1. - uVig*smoothstep(.25,.95, length(d*vec2(1.25,1.))*1.35);
    float g = fract(sin(dot(gl_FragCoord.xy + fract(uTime)*97., vec2(12.9898,78.233)))*43758.5453);
    c += (g-.5)*uGrain;
    gl_FragColor = vec4(c*(1.-uFade), 1.);
  }`,
};
