onScan.attachTo(document, {
    //FIX ME. SUFFIX CODE ENTER
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
    onKeyDetect: function(iKeyCode){ // output all potentially relevant key events - great for debugging!
       console.log('Pressed: ' + iKeyCode);
    },
    onScanError: function(oDebug){
        console.log(oDebug)
    } // Callback after detection of an unsuccessful scanning (scanned string in parameter)
   
});

class Barcode{
    constructor(barcodeReadWithPrefixAndSuffix){
        this.barcodeReadWithPrefixAndSuffix = barcodeReadWithPrefixAndSuffix
        this.toRow
        this.toColumn
        this.toShelf
    }

    get barcodeRead(){
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

    displayLocation(){
        //Check to make sure that the location is valid i.e just because the barcode started with * does not mean valid location
        if(!this.barcodeRead.includes("\\")){
            createGenericMessage('Invalid Location','No \\ specified','error')
            return
        }

        let locationArray = this.barcodeRead.split("\\")
        this.toRow = locationArray[0]
        this.toColumn = locationArray[1]

        //>=2? Shelf can be empty sometimes
        if(locationArray.length > 2){
            this.toShelf =""
        }
        $("#newBinLocation").html(`Location Selected For Movement <strong>Row: ${this.toRow}, Column : ${this.toColumn}</strong>, Shelf: ${this.toShelf}`)
    }

    displayBinContents(){
        $.ajax({
            type:"POST",
            url:"/getBinContents",
            data:{
                binNumber:this.barcodeRead
            },

            //I am using an arrow function instead of regular function in here because I need to access this
            //This inside the jquery function will refer to the jquery object if I use regular function
            // An arrow function does not have it's own this. 
            //The this value of the enclosing lexical scope is used; arrow functions follow the normal variable lookup rules. 
            //So while searching for this which is not present in current scope they end up finding this from its enclosing scope.

            success:(binContents)=>{

                
                $(".masthead").css("height", "");
                $("#scanSection").removeClass("d-none")

                anime({
                    targets: 'html, body',
                    //scrollTop: $(".masthead-subheading").offset().top - 72,
                    scrollTop: $(".binMovement").offset().top-150,
                    duration: 1000,
                    easing: 'easeInOutExpo'
                });

                tblBinContents.clear().draw()
                $(".binMovement").removeClass("d-none")
                $("#currentBinScannedForMovement").html(`Bin scanned <i class="fas fa-box-open ml-2"></i> <strong>${this.barcodeRead}</strong>`)
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
}




function createAndHandleBarcodeObject(sCode){
    let objBarcode = new Barcode(sCode)
    handleBarcode(objBarcode)
}
 


function handleBarcode(objBarcode){
    //Start by removing prefix from the barcodeRead
    console.log(objBarcode)
    console.log(objBarcode.barcodeType)
    // barcodeRead = barcodeRead.substring(2)
    // console.log(barcodeRead)

    if(objBarcode.barcodeType == "BIN"){
        objBarcode.displayBinContents()
    }
    else if(objBarcode.barcodeType == "LOC"){
        objBarcode.displayLocation()
    }
}