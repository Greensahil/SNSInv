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