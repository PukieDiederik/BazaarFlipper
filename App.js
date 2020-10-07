//general requires
const XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;  //Used for making calls to the hypixel api
require("dotenv").config();                                       //Initializes .env (Enviroment variables)

//general variables
const refreshTime = 60 * 1000; //refresh the flipper every x seconds
const AmountDisplayed = 10; //the amount of products that will be displayed at the end

//check if the .env file exists
const fs = require("fs");
fs.access("./.env", fs.constants.F_OK | fs.constants.R_OK, (err) => {
    if(err) { //If there is no .env create a new .env and add settings 
        console.log("No settings could be loaded");

        //ask the user for their api key
        let key;
        while(!key) {
            key = RequestKeyFromUser();
        }

        //create a new file
        let content = `API_KEY=${key}`;
        fs.writeFileSync(".env", content);
        console.log("Successfully setup API key");
    }

    //Start the flipper itself
    printProducts(GetProducts());
    setInterval(() => printProducts(GetProducts()),refreshTime);
});

//requests a key from the user
function RequestKeyFromUser(){
    const prompt = require("prompt-sync")(); //used for prompting the user
    let key = prompt("Please enter your api key: ");

    //check if the given key was valid
    let req = new XMLHttpRequest();
    req.open("GET", "https://api.hypixel.net/key?key=" + key, false); //make a sync call to the hypixel api
    req.send();

    //start processing the request
    if (req.status !== 200) { //check if the request was recieved properly
        console.error("[ERROR] Could not send key verification request: " + req.statusText);
    } else {
        res = JSON.parse(req.responseText); //get the json text

        if (!res.success) { //check if the key was valid
            console.error("[ERROR] Key was not verified: " + res.cause);
        } else { //if everything went right and the key was validated
            return key;
        }
    }
    
    //something went wrong with validating the key
    return null;
}

//Fetch and find the best products for profit
function GetProducts(){
    let products = [{ //A filler product that will be sorted out later
        "profit"        : 0
    }];

    //Fetch all the products from the hypixel API
    let request = new XMLHttpRequest;
    request.open("GET", "https://api.hypixel.net/skyblock/bazaar?key=" + process.env.API_KEY, false);
    request.send();

    //check if we have recieved the pro
    if(request.status == 200){
        res = JSON.parse(request.responseText); //parse the response to JSON
        productList = Object.keys(res.products); //get a list of all the products (cause hypixel decided to not use an array fsr)
        
        //loop through each product
        productList.forEach(productName => {
            let rawProduct = res.products[productName]; //the current product
            const timeMultiplier = (( 1 / 7 / 24 / 60 / 60) * (refreshTime / 1000)); //multiply by this to get the conversion from a week to [refreshTime]
            
            //If the product doesn't have a buy/sell summary set the buy/sell price to 0
            let buyPrice = rawProduct.sell_summary.length == 0 ? 0 : rawProduct.sell_summary[0].pricePerUnit;
            let sellPrice = rawProduct.buy_summary.length == 0 ? 0 : rawProduct.buy_summary[0].pricePerUnit;
            
            let amountToBuy = Math.round(rawProduct.quick_status.buyMovingWeek * timeMultiplier); //the amount of items the player should buy
            let investment = Math.round(amountToBuy * buyPrice);
            let product = { //the final product with all the information that will be displayed
                "name"          : rawProduct.quick_status.productId,
                "amountToBuy"   : amountToBuy,
                "investment"    : investment,
                "margin"        : Math.round(sellPrice - buyPrice),
                "profit"        : Math.round((amountToBuy * sellPrice) - investment)
            }

            //sort the product into the array
            for(let i = 0; i < products.length; i++){ //loop over each sorted product
                if (product.profit > products[i].profit){ //check if the profit is higher
                    products.splice(i,0, product); //nudge the new product in the array
                    if(products.length > AmountDisplayed) { products.pop(); } //make sure the array doesnt get too long
                    break; //stop searching
                }
            }
        });
        
        return products;
    }
    
    //something must have gone wrong
    return null;
}

function printProducts(products){
    //clear the console to show new products
    console.clear();
    //show general information
    console.log("USING API KEY: " + process.env.API_KEY);
    console.log("DATE: " + new Date().toString());

    //print out the table headers
    console.log("--------------------------------------------------------------------------");
    console.log("|     PRODUCT NAME     |  AMOUNT  |  INVESTMENT  |  MARGIN  |   PROFIT   |");
    console.log("--------------------------------------------------------------------------");
    
    products.forEach(product => {
        //style the properties correctly
        name       = product.name.length > 20 ? product.name.substring(0,17) + "..." : product.name  + ' '.repeat(20 - product.name.length);
        amount     = product.amountToBuy + ' '.repeat(8  - product.amountToBuy.toString().length);
        investment = product.investment  + ' '.repeat(12 - product.investment.toString().length);
        margin     = product.margin      + ' '.repeat(8  - product.margin.toString().length);
        profit     = product.profit      + ' '.repeat(10 - product.profit.toString().length);

        //print out the product
        console.log(`| ${name} | ${amount} | ${investment} | ${margin} | ${profit} |`);
    });
    //close the "table"
    console.log("--------------------------------------------------------------------------");

}