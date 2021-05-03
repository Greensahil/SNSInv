let glbCurrentBinScanned //This will keep track of current bin that is scanned

onScan.attachTo(document, {
    prefixKeyCodes: [02], // start of text ascii
    suffixKeyCodes: [09], // tab expected at the end of a scan
    reactToPaste: true, // Compatibility to built-in scanners in paste-mode (as opposed to keyboard-mode)
    avgTimeByChar:30,
    minLength:4,
    keyCodeMapper: function(oEvent) {
    
        // Adding this because it ignores hyphen keycode otherwise
       
        if (oEvent.which == 189) {  
            return '-';
        }
        if (oEvent.which == 220) {  
            return '\\';
        }
        
        // Fall back to the default decoder in all other cases
        return onScan.decodeKeyEvent(oEvent);
    },
    onScan: function(sCode, iQty) { // Alternative to document.addEventListener('scan')
        //Initialize a barcode object
        createAndHandleBarcodeObject(sCode)
    },
    onKeyDetect: function(iKeyCode){ // output all potentially relevant key events
       //console.log('Pressed: ' + iKeyCode);
    },
    onScanError: function(oDebug){
        console.log(oDebug)
    } // Callback after detection of an unsuccessful scanning (scanned string in parameter)
   
});

class Barcode{
    constructor(barcodeReadWithPrefixAndSuffix){
        this.barcodeReadWithPrefixAndSuffix = barcodeReadWithPrefixAndSuffix
    }

    get barcode(){
        //Start by removing prefix from the barcodeRead
        let strBarcodeRead = this.barcodeReadWithPrefixAndSuffix.substring(3)
        return strBarcodeRead
    }

    get barcodeType(){
        let barcodeSuffix = this.barcodeReadWithPrefixAndSuffix.substring(2).charAt(0)
        let strbarcodeType = ""
        switch(barcodeSuffix){
            case "!":
                strbarcodeType = "BIN"
                break
            case "`":
                strbarcodeType = "CMD"
                break
            case "#":
                strbarcodeType = "ITEM"
                break
            case "*":
                strbarcodeType = "LOC"
                break
        }

        return strbarcodeType
    }

}

class Bin{
    constructor({binNumber="NO BIN SELECTED", objMoveToLocation}={}){
        this.binNumber = binNumber
        this.newLocation = objMoveToLocation
        this.currentLocation //Current location is determined by the BIN object iteself
    }

    displayContainerForBinMovement(){
        $(".masthead").css("height", "");
        $("#scanSection").removeClass("d-none")
        anime({
            targets: 'html, body',
            //scrollTop: $(".masthead-subheading").offset().top - 72,
            scrollTop: $(".binMovement").offset().top-150,
            duration: 1000,
            easing: 'easeInOutExpo'
        });
    }

    displayBinContents(){
        $.ajax({
            type:"POST",
            url:"/getBinContents",
            data:{
                binNumber:this.binNumber
            },

            //I am using an arrow function instead of regular function in here because I need to access this
            //This inside the jquery function will refer to the jquery object if I use regular function
            // An arrow function does not have it's own this. 
            //The this value of the enclosing lexical scope is used; arrow functions follow the normal variable lookup rules. 
            //So while searching for this which is not present in current scope they end up finding this from its enclosing scope.

            success:(binContents)=>{

                if(binContents.length==0){
                    createGenericMessage("Empty Bin Detected", "Please scan a bin with contents",'warning')
                    return
                }

                this.displayContainerForBinMovement()

                this.currentLocation = new Location({locRow:binContents[0].VLocRow, locCol:binContents[0].VLocColumn, locShelf:binContents[0].VLocShelf})
                
                tblBinContents.clear().draw()
                $(".binMovement").removeClass("d-none")
                $("#currentBinScannedForMovement").html(`Bin scanned <i class="fas fa-box-open ml-2"></i> <strong>${this.binNumber}</strong>`)
                $("#currentBinLocation").text(`Current Location Row ${binContents[0].VLocRow}, Column ${binContents[0].VLocColumn}, Shelf ${binContents[0].VLocShelf}`)

                for(let item of binContents){
                    tblBinContents.row.add($(`
                        <tr>
                            <td>${item.SSInvID}</td>
                            <td>${item.QuantityAvailable}</td>
                            <td>${item.ProductItemNum}</td>
                            <td>${item.ShortDescription}</td>
                        </tr>
                    `))
                }

                //tblBinContents.responsive.recalc();
                tblBinContents.draw()

                
            }
        })
    }


    moveBin(){
        if(JSON.stringify(this.currentLocation)==JSON.stringify(this.newLocation)){
            createGenericMessage('Cannot Transfer bin to same location', `You tried to transfer bin to same location`,`warning`)
            return
        }

        $.ajax({
            type:"POST",
            url:"/moveBin",
            data:{
                binNumber:this.binNumber,
                newRow:this.newLocation.row,
                newCol:this.newLocation.col,
                newShelf:this.newLocation.shelf
            },
            success:function(){
                createGenericMessage('Bin has moved to new location')
                //Initliaze a new bin so that the bin info is refreshed
                intializeBinObject({binNumber:this.binNumber})
            }
        })

    }
}

class Location{
    //Location can be made from barcode or it can be made from locCol, row and shelf
    constructor({locationBarcode, locCol, locRow, locShelf}={}){

        if(locationBarcode){
            if(!this.verifyLocationBarcode(locationBarcode)){
                return //Error thrown by the method called
            }
            let locationArray = locationBarcode.split("\\")
            this.row = locationArray[0]
            this.col = locationArray[1]
            
            if(locationArray.length > 2){
                this.shelf =locationArray[2]
            }
            else{
                this.shelf = ""
            }
        }
        else if(locCol && locRow){
            this.row = locRow
            this.col = locCol
            this.shelf = locShelf?locShelf:""
        }


        
    }

    verifyLocationBarcode(locationBarcode){
        //FIX ME Add other checks here because tow backslahes should not be consequite, make ajax request to make sure location exists etc
        //Check to make sure that the location is valid i.e just because the barcode started with * does not mean valid location
        if(!locationBarcode.includes("\\")){
            createGenericMessage('Invalid Location','No \\ specified','error')
            return false
        }
        return true
    }

    //FIX ME: If this function ends up being the same as Bin class use mixins to copy object prototype
    displayContainerForToLoc(){
        $(".masthead").css("height", "");
        $("#scanSection").removeClass("d-none")
        anime({
            targets: 'html, body',
            scrollTop: $(".binMovement").offset().top-150,
            duration: 1000,
            easing: 'easeInOutExpo'
        });
        createGenericMessage(`Move To Location Set`,`New location <strong>Row: ${this.row}, Column : ${this.col}</strong>, <strong>Shelf: ${this.shelf}</strong>`,'success')
        $("#newBinLocation").html(`Location Selected For Movement <strong>Row: ${this.row}, Column : ${this.col}</strong>, <strong>Shelf: ${this.shelf}</strong>`)
    }

    // displayContainerForToLoc(){
    //     this.displayContainerForToLoc
        
    // }
}

function createAndHandleBarcodeObject(sCode){
    //FIX ME : ADD Validation here so that we only create objects if the barcode scanned is valid
    let objBarcode = new Barcode(sCode)
    handleBarcode(objBarcode)
}
 
function handleBarcode(objBarcode){
    if(objBarcode.barcodeType == "BIN"){
        intializeBinObject(objBarcode.barcode)
    }
    else if(objBarcode.barcodeType == "LOC"){
        let objLocation = new Location({locationBarcode:objBarcode.barcode})
        objLocation.displayContainerForToLoc()
        glbCurrentBinScanned.newLocation = objLocation

        //If they just scanned a location without scanning a bin just display the location
        //strigifying the objects so that is compares the contents rather than the address in the memory
        if(JSON.stringify(glbCurrentBinScanned) == JSON.stringify({})){
            return
        }

        //Move the bin
        glbCurrentBinScanned.moveBin()
        

        
    }
}

function intializeBinObject(binNumber){
        let objBin = new Bin({binNumber:binNumber})
        objBin.displayBinContents()
        glbCurrentBinScanned = objBin
}