
// Simon Game

let gameSeq=[];
let userSeq=[];

let btns = ["yellow","red","purple","green"];

let started = false;
let level =0;
let h2 = document.querySelector("h2");

document.addEventListener("keypress", function(){
    if(started == false){
        console.log("started ");
        started=true;
        levelUp();
    }
});

function gameFlash(btn){
    btn.classList.add("flash")
    setTimeout(function(){
        btn.classList.remove("flash");
    },250);
}

function userFlash(btn){
    btn.classList.add("userFlash")
    setTimeout(function(){
        btn.classList.remove("userFlash");
    },250);
}

function levelUp(){
    userSeq = [];
    level++;
    h2.innerText=`Level ${level}`;

    let ranIdx = Math.floor(Math.random()*3);
    let randColor = btns[ranIdx];
    let randBtn = document.querySelector(`.${randColor}`);
    // console.log(randBtn);
    // console.log(randColor);
    // console.log(ranIdx);
    gameSeq.push(randColor);
    gameFlash(randBtn);
}

function checkAns(idx){
    // console.log("curr level : ", level); 
    if(userSeq[idx] === gameSeq[idx]){
       if(userSeq.length == gameSeq.length){
        setTimeout(levelUp,1000);
       }
    }else{
        h2.innerHTML = `Game Over! Your Score was <b>${level}</b> <br> Press any key to start`;
        document.querySelector("body").style.backgroundColor = "red";
        setTimeout(function(){
            document.querySelector("body").style.backgroundColor = "white"; 
        },500 )
        reset();  
    }
}

function btnPress(){
    let btn = this;
    userFlash(btn);

    userColor = btn.getAttribute("id");
    userSeq.push(userColor);
    checkAns(userSeq.length-1);
}

let allBtns = document.querySelectorAll(".btn");
for(btn of allBtns){
    btn.addEventListener("click", btnPress);
}

function reset(){
    started = false;
    gameSeq = [];
    userSeq = [];
    level = 0;
}



function one(){
    return 1;
}
function two(){
    return one()+one();
}
function three(){
    let ans = two()+one();
    console.log(ans);
}
three();
h1 = document.querySelector("h1");
 function changeColor(color , delay){
   return new Promise((reslove , reject) =>{
        setTimeout(() => {
            h1.style.color = color;
            reslove("color changed");
        }, delay);
    
    });
}
   changeColor("red", 1000)
   .then(()=>{
    console.log("red color completed");
    return changeColor("orange",1000);
   })
   .then(()=>{
    console.log("orange changed ");
   });
 changeColor("red",1000, ()=>{
    changeColor("orange",1000, ()=>{
        changeColor("green",1000);
    });
 });
