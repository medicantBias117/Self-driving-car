const carCanvas=document.getElementById("carCanvas");
carCanvas.width=300;
const networkCanvas=document.getElementById("networkCanvas");
networkCanvas.width=600;

const carCtx = carCanvas.getContext("2d");
const networkCtx = networkCanvas.getContext("2d");

const laneCount = 3;

const road=new Road(carCanvas.width/2,carCanvas.width*0.9,laneCount);
var start = true;
const N=100;
const M = 5;
const cars=generateCars(N);
const currentGeneration = localStorage.getItem("currentGeneration")?localStorage.getItem("currentGeneration"):1;

let bestCar=cars[0];

// topLayerUpdate
const startTime = new Date();
const timeLayerID = document.getElementById("time");
const genLayer = document.getElementById("generation");

setInterval(function(){
    timeLayerID.innerHTML = "Elapsed: " + Math.floor((new Date() - startTime)/1000) + "s";
})


genLayer.innerHTML = "Gen " + currentGeneration;


// each generation can run for 10s
setTimeout(function(){
    endGame()
}, 10000)


if(localStorage.getItem("bestBrain")){
    for(let i=0;i<cars.length;i++){
        cars[i].brain=JSON.parse(
            localStorage.getItem("bestBrain"));
        if(i!=0){
            NeuralNetwork.mutate(cars[i].brain,0.4);
        }
    }
}

const traffic= trafficGenerator(M);

function trafficGenerator(M){
    trafficCount = M;
    let traffic = [];
    for (let i = 0; i < trafficCount; i++) {
        for (let j = 0; j < laneCount; j++){ // we'll end up with trafficCount x laneCount traffic cars
            //ensure car cannot start where we start:
            let y = randBetween(-90,25)*10;
            if(y < 40 && y > -40){
                y = -200;
            }
            traffic.push(new Car(road.getLaneCenter(j),
                                y,
                                30,
                                50,
                                "DUMMY",
                                randBetween(50,250)/100,
                                getRandomColor()));
            
        }
    }
    return traffic;
}


animate();





function save(){
    localStorage.setItem("bestBrain",
        JSON.stringify(bestCar.brain));
}

function discard(){
    localStorage.removeItem("bestBrain");
}

function startstop(){
    start = !start;
    animate();
}

function generateCars(N){
    const cars=[];
    for(let i=1;i<=N;i++){
        cars.push(new Car(road.getLaneCenter(1),100,30,50,"AI"));
    }
    return cars;
}

function animate(time){
    if(!start){ return;}
    
    if(cars.map( c => c.damaged).every(element => element === true)){ // cars are damaged. stop
        start = false;
        console.log("all cars are dead");
        //call endgame
        endGame(true)
    }


    for(let i=0;i<traffic.length;i++){
        traffic[i].update(road.borders,[]);
    }
    for(let i=0;i<cars.length;i++){
        cars[i].update(road.borders,traffic);
    }
    bestCar=cars.find(
        c=>c.y==Math.min(
            ...cars.map(c=>c.y)
        ));
    if(bestCar.damaged){
        //iterate through the cars and find the first active car:
        var x = cars.find( c => c.damaged === false && c.speed > 0);
        if(x){
            bestCar = x;
        }
        else{
            //startstop();
            // no car is moving
            //call endgame
        }


    }
    

    carCanvas.height=window.innerHeight;
    networkCanvas.height=window.innerHeight;

    carCtx.save();
    carCtx.translate(0,-bestCar.y+carCanvas.height*0.7);

    road.draw(carCtx);
    for(let i=0;i<traffic.length;i++){
        traffic[i].draw(carCtx);
    }
    carCtx.globalAlpha=0.2;
    for(let i=0;i<cars.length;i++){
        cars[i].draw(carCtx);
    }
    carCtx.globalAlpha=1;
    bestCar.draw(carCtx,true);

    carCtx.restore();

    networkCtx.lineDashOffset=-time/50;
    Visualizer.drawNetwork(networkCtx,bestCar.brain);
    requestAnimationFrame(animate);


    //also if the best car is damaged, we'll need to change focus to that one...
    
    

}

function endGame(allDead){
    // this is the end

    survivor = cars.find(c => c.y == Math.min(...cars.map(c => c.y)));
    localStorage.setItem("bestBrain",
                            JSON.stringify(survivor.brain));
    localStorage.setItem("currentGeneration",parseInt(currentGeneration)+1);
    location.reload();
}

function nukeEm(){
    localStorage.clear();
    location.reload();
}