var sport = "baseball";  
var player = null;  
  
function getPlayer() {  
    if (sport === "baseball") {  
        player = "Evan Longoria";  
    } else {  
        player = "Eva Longoria";  
    }  

    console.log(getPlayer2());
}

function getPlayer2() {  
    if (player === "Evan Longoria") {  
        player2 = "Derek Jeter";  
    } else {  
        player2 = "Teri Hatcher";  
    }  
    return player2;  
}