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
           

            if(window.location.pathname == "/landing" || window.location.pathname == "/landing/" ){
                let failureAudio = new Audio('/sounds/failure.wav')
                failureAudio.play()
            }
            return false

           
        }
    });
});


//FIX ME: IGNORE TAB WITHOUT THIS TAB KEY IS PRESSED SINCE IT ENDS WITH TAB
//WILL NEED TO FIX THE OSCAN LIB
$(document).keydown(function(objEvent) {
    if (objEvent.keyCode == 9) {  //tab pressed
        objEvent.preventDefault(); // stops its action
    }
})