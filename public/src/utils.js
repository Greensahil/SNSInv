function createGenericMessage(title,content,type,delayInSeconds){ //Type = Error||Success||Warning
    $.toast({
        position: 'top-right',
        dismissible: true, 
        stackable: true, 
        pauseDelayOnHover: true, 
        title:title,
        content:content,
        type: type,
        delay: delayInSeconds ?delayInSeconds * 1000 : 5000
    });
}

$(function() {
    $.ajaxSetup({
        error: function(jqXHR, exception) {
            console.log(jqXHR)
            console.log(exception)
            $.toast({
                position: 'top-right', /** top-left/top-right/top-center/bottom-left/bottom-right/bottom-center - Where the toast will show up **/
                dismissible: true, /** true/false - If you want to show the button to dismiss the toast manually **/
                stackable: true, /** true/false - If you want the toasts to be stackable **/
                pauseDelayOnHover: true, /** true/false - If you want to pause the delay of toast when hovering over the toast **/
                title: jqXHR.statusText,
                subtitle: jqXHR.status,
                content: (jqXHR.responseJSON)?jqXHR.responseJSON.message:"Unspecified Error",
                type: 'error',
                delay: 5000
            });
            HideLoadingAnimation() //We use this function to hide loading animations in various pages. So running this function so that the loading animation does not reamin there

            if(window.location.pathname == "/qcUnknownBarcode" || window.location.pathname == "/qcUnknownBarcode/" ){
                let failureAudio = new Audio('/sounds/failure.wav')
                failureAudio.play()
            }
            return false

           
        }
    });
});