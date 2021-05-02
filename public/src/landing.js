const tblBinContents = $('#tblBinContents').DataTable({
    "pageLength": 100,
    "language": {
        "emptyTable": "This bin is empty"
    }
    ,
   
    "paging":   false,
    "searching":   false,
    // "info":     false,
    //This bascailly clearouts the search bar on page refresh. Chrome fills it up on page refresh sometimes with saved username or password
    initComplete: function() {
        $(this.api().table().container()).find('input').parent().wrap('<form>').parent().attr('autocomplete', 'off');
    }
});

