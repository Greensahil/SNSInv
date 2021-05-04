
// let glbCurrentBinScanned //This will keep track of current bin that is scanned
let glbBarcodeMemoryArr = []

let glbOnTabletOrPhone = window.mobileAndTabletCheck()

const defaultBarcodeProperties = {
    prefix:"02",
    suffix:"09"
}



onScan.attachTo(document, {
    //This library ignores the predix and suffix that is entered here. Check the lib code to see what it ignores by default
    //I found inconsistent results so, I will parse the barcode myself so telling it to not ignore anything
    prefixKeyCodes: [], // start of text ascii
    suffixKeyCodes: [], // tab expected at the end of a scan
    reactToPaste: true, // Compatibility to built-in scanners in paste-mode (as opposed to keyboard-mode)
    avgTimeByChar:90,
    minLength:4,
    keyCodeMapper: function(oEvent) {
    
        // Adding this because it ignores hyphen keycode otherwise
       
        if (oEvent.which == 189) {  
            return '-';
        }
        if (oEvent.which == 220) {  
            return '\\';
        }
        if (oEvent.which == 9) {  
            return '09';
        }
        //The samsung device which returns 18 when ascii 02 is scanned so.
        if (oEvent.which == 18) {
            if(glbOnTabletOrPhone){
                return '02';    
            }
        }
        if (oEvent.which == 2) {  
            return '02';
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

//It is not a good pratice to validate object parameters while creating a class inside the class itself. It is always recommended to fail as early as possible
//If the barcode object is being initialized, the class assumes that at least the barcodeReadWithPrefixAndSuffix was checked for appropriate prefix, suffix and length
class Barcode{
    constructor(barcodeReadWithPrefixAndSuffix){
        this.barcodeReadWithPrefixAndSuffix = barcodeReadWithPrefixAndSuffix
        
    }

    get barcode(){
        let strBarcodeRead = this.barcodeReadWithPrefixAndSuffix.substring(3)
        strBarcodeRead = strBarcodeRead.substring(0, strBarcodeRead.length-2)
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
        this.binContents
        //Each new bin scan resets to move to location as you can see above
        //This should therefore also refresh the HTML text in the front end
        $("#newBinLocation").html("")
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

    setUpBinContentsAndCurrentLocation(blnDisplayContents){
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
                this.binContents = binContents
                this.currentLocation = new Location({locRow:binContents[0].VLocRow, locCol:binContents[0].VLocColumn, locShelf:binContents[0].VLocShelf})     
                if(blnDisplayContents){
                    this._displayBinContents()
                }
            }
        })


    }

    //do not call this function directly as the contents might not have been delivered as the contents are from ajax request
    _displayBinContents(){
        this.displayContainerForBinMovement()
        tblBinContents.clear().draw()
        $(".binMovement").removeClass("d-none")
        $("#currentBinScannedForMovement").html(`Bin scanned <i class="fas fa-box-open ml-2"></i> <strong>${this.binNumber}</strong>`)
        $("#currentBinLocation").text(`Current Location Row ${this.binContents[0].VLocRow}, Column ${this.binContents[0].VLocColumn}, Shelf ${this.binContents[0].VLocShelf}`)

        for(let item of this.binContents){
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
                fromRow:this.currentLocation.row,
                fromCol:this.currentLocation.col,
                fromShelf:this.currentLocation.shelf,
                toRow:this.newLocation.row,
                toCol:this.newLocation.col,
                toShelf:this.newLocation.shelf
            },
            success:()=>{
                anime({
                    targets: '#currentBinScannedForMovement',
                    translateX: 250,
                    direction: 'alternate',
                    easing: 'easeInOutSine'
                });
                createGenericMessage('Bin has moved to new location',`<strong>${this.binNumber}</strong> has been moved`,'success')

                //Change display to reflect new bin info
                $("#newBinLocation").html("")
                $("#currentBinLocation").text(`Current Location Row ${this.newLocation.row}, Column ${this.newLocation.col}, Shelf ${this.newLocation.shelf}`)
                //Initliaze a new bin so that the bin info is refreshed
                //intializeBinObject(this.binNumber)

        
                
            }
        })

    }
}

class Location{
    //Location can be made from barcode or it can be made from locCol, row and shelf
    constructor({locationBarcode, locCol, locRow, locShelf}={}){
        //FIX ME: BAD practice, verrify location before instansiation
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

    //FIX ME: BAD practice, verrify location before instansiation
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
        //createGenericMessage(`Move To Location Set`,`New location <strong>Row: ${this.row}, Column : ${this.col}</strong>, <strong>Shelf: ${this.shelf}</strong>`,'success')
        $("#newBinLocation").html(`Location Selected For Movement <strong>Row: ${this.row}, Column : ${this.col}</strong>, <strong>Shelf: ${this.shelf}</strong>`)
    }

}

function createAndHandleBarcodeObject(sCode){
    if(validateBarcodeSuffixAndPrefix(sCode)){
        let objBarcode = new Barcode(sCode)
        handleBarcode(objBarcode)
    }
}
 
function handleBarcode(objBarcode){
    if(objBarcode.barcodeType == "BIN"){
        intializeBinObject(objBarcode.barcode)
    }
    else if(objBarcode.barcodeType == "LOC"){
        //If the location is scanned but a bin is yet to be scanned just return null
        //strigifying the objects so that is compares the contents rather than the address in the memory
        
        let lastObjectScanned = getLastObjectScanned()
        if(!(lastObjectScanned instanceof Bin)){
            createGenericMessage('Location Scanned Ignored','The location scanned has been ignored because the last object scanned was not a bin','warning')
            return
        }


        let objLocation = new Location({locationBarcode:objBarcode.barcode})
        //Check to see if the current bin location is not the same as new location
        if(JSON.stringify(lastObjectScanned.currentLocation) == JSON.stringify(objLocation)){
            createGenericMessage('Move Cancelled', 'You tried to move the bin to the location it is currently in','warning')
            return
        }

        pushObjectToGlobalMemoryArray(objLocation)
        objLocation.displayContainerForToLoc()

        //At this point we know that the previous object that was scanned before the location was a bin. So set the new location of that bin and move it
        lastObjectScanned.newLocation = objLocation
        //Move the bin
        lastObjectScanned.moveBin()
    
        
    }
    else{
        createGenericMessage("Neither BIN OR LOC WAS Scanned", "Please scan a bin or  location", "error")
    }
}

function intializeBinObject(binNumber){

        let lastObjectScanned = getLastObjectScanned()
        let objBin = new Bin({binNumber:binNumber})
        pushObjectToGlobalMemoryArray(objBin)

        if(!(lastObjectScanned instanceof Bin)){
            //Last object scanned was not a bin so just display the contents of this bin
            objBin.setUpBinContentsAndCurrentLocation(true)
            return
        }

        //Last object that was scanned was a bin
        //Was it the same bin?
        if(JSON.stringify(lastObjectScanned) == JSON.stringify(objBin)){
            createGenericMessage('Ignoring Scan','Ignoring scan because you scanned the same bin twice', 'warning')
            return
        }

        //This means that the user wants to merge bin
        // objBin.setUpBinContentsAndCurrentLocation()
        mergebin(lastObjectScanned,objBin)


        //glbCurrentBinScanned = objBin
}



function mergebin(objSourceBin, objDestinationBin){
    //There are 2 reason why I am not sending the bin info and letting backend handle it.
        //1. The bin info might have changed
        //2. There is no gurantee that the source or destination has the bin info loaded by the ajax request.


    // let sourceRow = objSourceBin.currentLocation.row
    // let sourceCol = objSourceBin.currentLocation.col
    // let sourceShelf = objSourceBin.currentLocation.shelf
    let sourceBin = objSourceBin.binNumber

    // let destinationRow = objDestinationBin.currentLocation.row
    // let destinationCol = objDestinationBin.currentLocation.col
    // let destinationShelf = objDestinationBin.currentLocation.shelf
    let destinationBin = objDestinationBin.binNumber


    $.ajax({
        type:"POST",
        url:"/mergeBin",
        data:{
            sourceBin,
            destinationBin
        },
        success:function(data){
            createGenericMessage('Bin Merged', `Contents of bin <strong>${sourceBin}</strong> has been transferred to destination bin <strong>${destinationBin}</strong>`,'success')
        }
    })


}


function validateBarcodeSuffixAndPrefix(rawBarcodeScanned){
    //Start by removing prefix from the barcodeRead
    //Check to make sure that the suffix of ASCII 02 and Prefix of ASCII is there
    let prefix =rawBarcodeScanned.substring(0,2)
    let suffix = rawBarcodeScanned.substring(rawBarcodeScanned.length-2,rawBarcodeScanned.length)

    if(prefix != defaultBarcodeProperties.prefix){
        createGenericMessage('INVALID BARCODE','PREFIX 02 NOT DETECTED','error')
        return false
    }
    if(suffix != defaultBarcodeProperties.suffix){
        createGenericMessage('INVALID BARCODE','SUFFIX 09 NOT DETECTED','error')
        return false
    }

    return true
}

function pushObjectToGlobalMemoryArray(obj){
    //The array should only store the last 2 objects that were scanned. Since I am shifting it the array should not have more than 2 items but just in case
    glbBarcodeMemoryArr = glbBarcodeMemoryArr.splice(-2)

    //If the array only has 1 item in it then just push it else make room
    if(glbBarcodeMemoryArr.length == 2){
        //remove the first element and shift all other elements to left
        glbBarcodeMemoryArr.shift()
    }
    glbBarcodeMemoryArr.push(obj)
}

function getLastObjectScanned(){
    //The last object that was scanned should be the last item of the array unless the array at this point in time only has one item in it
    return glbBarcodeMemoryArr[1]?glbBarcodeMemoryArr[1]:glbBarcodeMemoryArr[0]
}