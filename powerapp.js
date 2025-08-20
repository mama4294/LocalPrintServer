
//The woring function with no notifications
function printLabelsFromGrid(selectedControl) {
    var gridContext = selectedControl.getGrid();
    var selectedRows = gridContext.getSelectedRows();

    if (selectedRows.getLength() === 0) {
        alert("⚠️ Please select at least one row.");
        return;
    }

    var recordIds = [];

    selectedRows.forEach(function (row) {
        var rowData = row.getData();
        var entity = rowData.getEntity();
        var rawId = entity.getId();
        var cleanedId = rawId.replace(/[{}]/g, "");
        recordIds.push(cleanedId);
    });

    var payload = {
        recordIds: recordIds
    };

    var flowUrl = "https://prod-98.westus.logic.azure.com:443/workflows/4156e8251dde461faf1ef1c0f65c4bed/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=jFVH_1iEXmQaX5J_85pxK7UMoqvXHihPioOOzz1DKMI";

    fetch(flowUrl, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error("Flow call failed: " + response.status);
        }
        return response.text();
    })
    .then(data => {
        console.log("Flow triggered successfully:", data);
        alert("✅ Labels sent to printer. Please be patient.");
    })
    .catch(error => {
        console.error("Error triggering flow:", error);
        alert("❌ Failed to trigger flow. See console for details.");
    });
};


function testNotification(selectedControl) {
   // define notification object
var notification = 
{
  type: 2,
  level: 3, //warning
  message: "Test warning notification",
  showCloseButton: true
}

Xrm.App.addGlobalNotification(notification).then(
    function success(result) {
        console.log("Notification created with ID: " + result);
        // perform other operations as required on notification display
    },
    function (error) {
        console.log(error.message);
        // handle error conditions
    }
);}


function printLabelsFromGridV3(selectedControl) {

    console.log("printLabelsFromGridV3 called");

    var gridContext = selectedControl.getGrid();
    var selectedRows = gridContext.getSelectedRows();

    if (selectedRows.getLength() === 0) {
        var noSelectionNotification = {
            type: 2,
            level: 2, // error
            message: "❌ Please select at least one record to print labels.",
            showCloseButton: true
        };
        Xrm.App.addGlobalNotification(noSelectionNotification);
        return;
    }

    var recordIds = [];

    selectedRows.forEach(function (row) {
        recordIds.push(row.getData().getEntity().getId().replace(/[{}]/g, ""));
    });


    var flowUrl = "https://prod-98.westus.logic.azure.com:443/workflows/4156e8251dde461faf1ef1c0f65c4bed/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=jFVH_1iEXmQaX5J_85pxK7UMoqvXHihPioOOzz1DKMI";
    var payload = { recordIds: recordIds };

    // Notify that printing has started
    var initNotification = {
        type: 2,
        level: 4, // info
        message: "🖨️ Sending labels to printer...",
        showCloseButton: true
    };
    Xrm.App.addGlobalNotification(initNotification)
        .then(function (id) {
        // Auto-hide after 3 seconds
        setTimeout(function () {
            Xrm.App.clearGlobalNotification(id);
        }, 3000);
        });


    fetch(flowUrl, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
    })
    .then(response => {
        if (!response.ok) {
            console.log("Flow call failed with status: " + response.status + " - " + response.ok);
            throw new Error("Failed to print labels: " + response.status);
        }
        return response.json();
    })
    .then(data => {
        console.log("Flow triggered successfully:", data);
        var successNotification = {
            type: 2,
            level: data.status === "success" ? 1 : 2, // info if success, error if failure
            message: data.message || (data.status === "success" ? "Labels printed successfully." : "Failed to print labels."),
            showCloseButton: true
        };
        Xrm.App.addGlobalNotification(successNotification).then(function (id) {
        // Auto-hide after 3 seconds
        setTimeout(function () {
            Xrm.App.clearGlobalNotification(id);
        }, 3000);
        });
    })
    .catch(error => {
        console.error("Error triggering flow:", error);
        var errorNotification = {
            type: 2,
            level: 2, // error
            message: "Failed to print labels. " + error.message,
            showCloseButton: true
        };
        Xrm.App.addGlobalNotification(errorNotification);
    });
}


