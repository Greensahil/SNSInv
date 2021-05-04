//Shrink navbar by default
$("#mainNav").addClass("navbar-shrink");


const tblUserAudit = $('#tblUserAudit').DataTable({
    "pageLength": 20,
    "language": {
        "emptyTable": "You have no audit history"
    },
    "ordering":false,
    // "info":     false,
    //This bascailly clearouts the search bar on page refresh. Chrome fills it up on page refresh sometimes with saved username or password
    initComplete: function() {
        $(this.api().table().container()).find('input').parent().wrap('<form>').parent().attr('autocomplete', 'off');
    }
});


function populateAuditHistory(auditHistory){
    tblUserAudit.clear()

    for(let item of auditHistory){
        tblUserAudit.row.add($(`
            <tr>
                <td>${moment(item.ATimeStamp).utc().format('MMMM Do YYYY, h:mm:ss a')}</td>
                <td>${item.FieldName}</td>
                <td>${item.OLDVALUE}</td>
                <td>${item.NEWVALUE}</td>
                <td>${item.Notes}</td>
            </tr>
        `))
    }

    tblUserAudit.draw()
    
}