


// let x = 10;
// let y = 10;

// if(x<y){
//     alert('x est plus petit que y');
// } 
// if(x>y){
//     alert('x est plus grand que y');
// }
// if(x==y){
//     alert('il sont egaux');
// }
// function faireQuelleQueChose (){
//     console.log(2+3);
    
// }
//     faireQuelleQueChose()


// let nom =" kouame";
// let prenom = " selme alpha"
// let age = 20 + " ans";


// console.log(`ton nom est ${nom}${prenom} et tu a ${age}`);

// function etudiant (){
//      console.log( nom ="kouame");
//      console.log(prenom =" selme alpha");
//      console.log(age = 20+" ans");
     
// }
// etudiant()



//  let age =25;

//  if(age>=20){
//     console.log('tu es marjeur');
    
//  }else console.log('tu es mineur');


// let myAge = 44;

// if(myAge=== "44"){
//     console.log('myAge est egale a 44');

// }else {
//     console.log('my Age est pas egale a 44')

    
// }
// console.log(myAge);


// let myAge = 10;

// if(myAge>0 && myAge<=18){
//     console.log('age superieur ou egale a 18');
// }else console.log('condition est false');






// console.log(myAge);


// let myName = "alphaklsdfmlkdfmslf";

// if(myName.length>10){
//     console.log("M");
    
// }else console.log("F");

// console.log(myName);

// const myName2 = "selmealpha".length>10 ?"vrai" : "faux";

// console.log(myName2);

//  const myName3 ="selmealhjgjhgjgjhgjgjg".length>10 ? "vrai":"faux";

// console.log(myName3);




// ALGORITHME DE REFLEXION
// information

// let nomEtPrenom = prompt("entrer votre nom complet");
//     // console.log(`votre nom complet est ${nomEtPrenom}`);



// let age = prompt('entrer votre age') +" ans";
//         // console.log(`vous avez ${age} `);
        
// let sex = confirm('entrer votre sex');
//             if(sex === false){
//                 console.log("Masculin");   
//             }else console.log("Feminin");
            
            // console.log(sex); 
            
// if(sex != "M"){
//     console.log("Feminin");
// }else if (sex === "M") console.log("masculin");

// information = nom+prenom+age+sex;

// console.log(`vous etes ${information}`);

// function diplome (){
//    let CEPE = (Boolean)
// }
// diplome()






// les image s'envole sil sont sont identique



let firstButton = null;
let secondButton = null;
let countdownStarted = false;
let countdownInterval;

function startCountdown() {
    const timer = document.getElementById("time-game");
    let minutes = 1;
    let seconds = 0;

    countdownInterval = setInterval(() => {
        if (seconds === 0) {
            if (minutes === 0) {
                clearInterval(countdownInterval);
                disableAllButtons(); // Désactive tous les boutons
                return;
            }
            minutes--;
            seconds = 59;
        } else {
            seconds--;
        }

        // Formatage du temps
        const minDisplay = minutes < 10 ? "0" + minutes : minutes;
        const secDisplay = seconds < 10 ? "0" + seconds : seconds;

        timer.innerHTML = `<span>${minDisplay} min</span> <span>${secDisplay} s</span>`;
    }, 1000);
}

function disableAllButtons() {
    const buttons = document.querySelectorAll(".carte button");
    buttons.forEach((button) => {
        button.disabled = true;
        button.style.cursor = "not-allowed";
        button.style.opacity = "0.5"; // Pour indiquer visuellement que les boutons sont désactivés
    });
}

function showImage(buttonId, imgId, textId) {
    if (!countdownStarted) {
        countdownStarted = true;
        startCountdown(); // Démarre le compte à rebours
    }

    const button = document.getElementById(buttonId);
    const img = document.getElementById(imgId);
    const text = document.getElementById(textId);

    // Affiche l'image et cache le texte
    text.style.display = "none";
    img.style.display = "block";

    if (!firstButton) {
        firstButton = { button, img };
    } else {
        secondButton = { button, img };
    }

    // Après 1 seconde, cache l'image et réaffiche le texte
    setTimeout(() => {
        img.style.display = "none";
        text.style.display = "block";

        if (firstButton && secondButton) {
            if (firstButton.img.src === secondButton.img.src) {
                // Animation d'envol
                firstButton.button.style.transition = "transform 0.5s ease, opacity 0.5s ease";
                firstButton.button.style.transform = "translateY(-200px)";
                firstButton.button.style.opacity = "0";

                secondButton.button.style.transition = "transform 0.5s ease, opacity 0.5s ease";
                secondButton.button.style.transform = "translateY(-200px)";
                secondButton.button.style.opacity = "0";

                // Supprime les boutons après l'animation
                setTimeout(() => {
                    firstButton.button.style.visibility = "hidden";
                    secondButton.button.style.visibility = "hidden";
                }, 500);
            }
        }

        firstButton = null;
        secondButton = null;
    }, 1000);
}
