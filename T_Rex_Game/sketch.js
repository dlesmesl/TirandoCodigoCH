const x_res=600;
const y_res=200;
const body_color=83;
const jump_dist=[200,599];
let speed;
let obstacles;
let _floor=[];
let obs_sprites=[];
let obs_sprites_hitbox=[];
let character_sprites;
let character_sprites_hitbox;
let floor_sprites=[];
let next_obs;
let dino;
let retry;
var temp_start=false;
let current_gameframe;
let current_score;
let highest_score=0;

function get_hitboxs(load_result){
  let hitboxes=[];
  let keys=split(load_result[0],'\t');
  for (let i=1;i<load_result.length;i++){
    load_result[i]=split(load_result[i],'\t');
    hitboxes.push(new Object);
    for (j=0;j<keys.length;j++){
      hitboxes[hitboxes.length-1][keys[j]]=int(load_result[i][j]);
    }
  }
  return hitboxes;
}
function hitbox_offset(pos,hitbox){
  if (Array.isArray(hitbox)){
    let output=[];
    for (let part of hitbox){
      output.push(hitbox_offset(pos,part))
    }
    return output;
  }else{
    let Final_hitbox={};
    Final_hitbox.left=hitbox.left+pos.x;
    Final_hitbox.right=hitbox.right+pos.x;
    Final_hitbox.top=hitbox.top+pos.y;
    Final_hitbox.bot=hitbox.bot+pos.y;
    return Final_hitbox;
  }
}
function collision(hitbox1,hitbox2){
  if (Array.isArray(hitbox2)){
    for (let part2 of hitbox2){
      if (collision(hitbox1,part2)){return true;}
    }
  }else{
    if (Array.isArray(hitbox1)){
      for (let part of hitbox1){
        if (collision(part,hitbox2)){return true;}
      }
      return false;
    }
    return hitbox1.right>hitbox2.left&&hitbox1.bot>hitbox2.top&&hitbox1.left<hitbox2.right&&hitbox1.top<hitbox2.bot
  }
}
function reset_game(){
  current_gameframe=0;
  current_score=0;
  speed=6;
  obstacles=[new Obstacle()];
  next_obs=random(jump_dist);
  dino=new Character();
}

function preload(){
  font=loadFont('data/ka1.ttf');
  lines=loadStrings('data/sprites_hitbox.txt');
  retry=loadImage('data/retry_button.png');
  character_sprites={
    walk:[loadImage('data/dino_walk0.png'),loadImage('data/dino_walk1.png')],
    jump:loadImage('data/dino_jump.png'),
    down:[loadImage('data/dino_down0.png'),loadImage('data/dino_down1.png')],
    dead:[loadImage('data/dino_dead0.png'),loadImage('data/dino_dead1.png')],
    start:loadImage('data/dino_start.png')
  }
  for (let i=0;i<6;i++){ //load envirinment sprites
    obs_sprites[i]=loadImage('data/Cactus'+i+'.png');
    if (i<2){
      floor_sprites[i]=loadImage('data/floor'+i+'.png');
    }
  }
  obs_sprites.push([loadImage('data/aero0.png'),loadImage('data/aero1.png')]);
}
function setup(){
  let all_hitboxes=get_hitboxs(lines);
  character_sprites_hitbox={down:all_hitboxes.pop()}
  for (let i=0;i<9*3;i++){
    if (i%3==0){obs_sprites_hitbox.push([]);}
    obs_sprites_hitbox[obs_sprites_hitbox.length-1].push(all_hitboxes.shift());
  }
  character_sprites_hitbox['stand']=obs_sprites_hitbox.pop();
  let temp_aero=obs_sprites_hitbox.splice(-2,2);
  obs_sprites_hitbox.push(temp_aero);
  delete window.lines;
  createCanvas(x_res,y_res);
  _floor.push(new Floor(0),new Floor());
  frameRate(30);
  textFont(font);
  reset_game();
}
function draw(){
  background(255);
  textSize(16);
  textAlign(LEFT,BASELINE);
  text('HI - '+str(highest_score),5,15);
  text('SC - '+str(current_score),5,35);
  if ((keyIsDown(32)||keyIsDown(UP_ARROW))){ // dino jump
    if (dino.pos.y==y_res-dino.h&&dino.Alive){
      if (temp_start==false){
        temp_start=true;
      }
      dino.jump();
    }
  }
  if (keyIsDown(ENTER)&&dino.Alive==false){ //reset the game
    reset_game();
  }
  if (temp_start){ //game start
    if (_floor[_floor.length-1].pos.x<=0){//floor adition
      _floor.push(new Floor());
    }
    for (let floor_segment of _floor){//floor animation
      floor_segment.run(speed);
    }
    if (x_res-obstacles[obstacles.length-1].xpos()>=next_obs){ //obstacles adition
      obstacles.push(new Obstacle());
      next_obs=random(jump_dist);
    }
    if (obstacles[0].xpos()<0){ //speed increasing
      obstacles.shift();
      if (speed<35){
        speed+=0.2;
      }
    } //CHECK
    for (let obs of obstacles){ //obstacles animation
      obs.run(speed);
    }
    if (keyIsDown(DOWN_ARROW)){ //makes dino goes down with arrow key
      dino.isDown=true;
    }else{
      dino.isDown=false;
    }
    dino.run();
    if (dino.Alive){
      current_gameframe+=1;
      current_score=Math.floor(10*current_gameframe/32);
    }
    if (collision(dino.current_hitbox,obstacles[0].current_hitbox)){// || collision(dino.current_hitbox,obstacles[1].current_hitbox)){
      dino.Alive=false;
      speed=0;
      image(retry,(x_res-retry.width)/2,(y_res-retry.height)/2);
      textAlign(CENTER,BASELINE);
      if (current_score>=highest_score){
        highest_score=current_score;
        text('perdiste. pero es un nuevo record!',x_res/2,y_res/2-retry.height);
      }else{
        text('perdiste. sigue intentandolo',x_res/2,y_res/2-retry.height);
      }
    }
  }else{
    textAlign(CENTER,TOP);
    text('hola! este juego es igual al de google chrome.\npara reiniciar cuando pierdas, pulsa enter.',x_res/2,60);
    image(dino.sprites.start,dino.pos.x,dino.pos.y);
  }
}

class Character{
  constructor(){
    this.sprites=character_sprites;
    this.hitboxs=character_sprites_hitbox;
    this.current_sprite;
    this.current_hitbox;
    this.h=this.sprites.walk[0].height
    this.pos=createVector(100,y_res-this.h);
    this.vel=createVector();
    this.grav=1.2;
    this.isDown=false;
    this.index=0;
    this.Alive=true;
  }
  jump(){
    dino.vel.y=-15;
  }
  show(){ //FIX THE HITBOX STUFF
    if (this.Alive){
      if (this.pos.y<y_res-this.h&&this.Alive){ // when jumping
        this.current_sprite=this.sprites.jump;
        this.current_hitbox=hitbox_offset(this.pos,this.hitboxs.stand);
        image(this.current_sprite,this.pos.x,this.pos.y);
      }else if (!this.isDown&&this.Alive){ // when walking
        this.current_sprite=this.sprites.walk[floor(this.index)%this.sprites.walk.length];
        this.current_hitbox=hitbox_offset(this.pos,this.hitboxs.stand);
        image(this.current_sprite,this.pos.x,this.pos.y);
        this.index+=0.05;
      }else if (this.isDown&&this.Alive){ // when down
        this.current_sprite=this.sprites.down[floor(this.index)%this.sprites.down.length];
        this.current_hitbox=hitbox_offset(this.pos,this.hitboxs.down);
        image(this.current_sprite,this.pos.x,this.pos.y);
        this.index+=0.05;
      }
    }else{
      this.grav=0;
      this.vel=createVector();
      this.current_sprite=this.sprites["dead"][1];
      image(this.current_sprite,this.pos.x,this.pos.y);
    }
    return this;
  }
  forces(){
    this.vel.y+=this.grav;
		this.pos.y+=this.vel.y;
		this.pos.y=constrain(this.pos.y,0,y_res-this.h);
		return this;
  }
  run(){
    return this.forces().show();
  }
}
class Floor{
  constructor(x=x_res){
    this.sprite=random(floor_sprites);
    this.pos=createVector(x,y_res-this.sprite.height)
    this.vel=createVector();
  }
  move(sp){
    this.vel.x=sp;
    this.pos.x-=this.vel.x;
    return this;
  }
  show(){
    image(this.sprite,this.pos.x,this.pos.y);
    return this;
  }
  run(sp){
    return this.show().move(sp);
  }
}
class Obstacle{
  constructor(){
    this.sprite=random(obs_sprites);
    // this.sprite=obs_sprites[obs_sprites.length-1]; //test only birds
    this.hitboxs=obs_sprites_hitbox[obs_sprites.indexOf(this.sprite)];
    this.current_hitbox;
    if (Array.isArray(this.sprite)){
      this.w=this.sprite[0].width;
      this.pos=createVector(x_res,y_res-this.sprite[0].height-random([50,30,10]));
      this.index=0;
    }else{
      this.w=this.sprite.width;
      this.pos=createVector(x_res,y_res-this.sprite.height)
    }
    this.vel=createVector();
  }
  move(sp){
    this.vel.x=sp;
    this.pos.x-=this.vel.x;
    return this;
  }
  show(){
    if (Array.isArray(this.sprite)){
      this.current_hitbox=hitbox_offset(this.pos,this.hitboxs[floor(this.index)%this.hitboxs.length]);
      image(this.sprite[floor(this.index)%this.sprite.length],this.pos.x,this.pos.y);
      if (this.vel.x!=0){
        this.index+=0.05; //FPS sprite
      }
    }else{
      this.current_hitbox=hitbox_offset(this.pos,this.hitboxs);
      image(this.sprite,this.pos.x,this.pos.y);
    }
    return this;
  }
  xpos(){
    return(this.pos.x+this.w)
  }
  run(sp){
    return this.move(sp).show();
  }
}
