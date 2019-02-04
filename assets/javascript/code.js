// Initialize Firebase
var config = {
    apiKey: "AIzaSyBPaWbwFnmAtTNKnojkSSyM58hyeqcbRG4",
    authDomain: "fir-assignment-87674.firebaseapp.com",
    databaseURL: "https://fir-assignment-87674.firebaseio.com",
    projectId: "fir-assignment-87674",
    storageBucket: "fir-assignment-87674.appspot.com",
    messagingSenderId: "508735507836"
};
firebase.initializeApp(config);

var data = firebase.database();
var misc = data.ref("/misc");
var connections = data.ref(".info/connected");
var intervalID; // used to initiate the SetInterval

// event listener when client is connected to database
connections.on("value", function (snapshot) {
    if (snapshot.val()) { // client is connected
        let connections = 1;

        // Use once to execute only during .then()
        misc.once('value').then(function (miscSnap) {
            if (miscSnap.val() === null) { // undefined
                misc.set({
                    "connections": 1
                });
            } else { // connections previously using database
                connections = miscSnap.val().connections;
                misc.set({
                    "connections": ++connections
                });
            }
            // when the user disconnects, decrement the connections
            misc.onDisconnect().update({
                "connections": --connections
            });
        })
    }
});

// function to periodically updated minutes to arrival and arrival times, as appropriate
function updateSavedData() {
    // called by setInterval, so we only want the action called once
    data.ref("/data").once('value').then(function (snapshot) {
        let trainData = snapshot.val();

        // data is returned as an object, each dataset as a nexted object named by the firebase id method. Use these to access data
        var keys = Object.keys(trainData);

        //iterate over the keys array to update minutes to arrival, and the next arrival as appropriate
        for (let i = 0; i < keys.length; i++) {

            // get the current number of minutes for the iteration
            let updatedMinutes = trainData[keys[i]].minutesAway;

            // next block runs when the updatedMinutes is zero (mintues are updated at the end)
            if (updatedMinutes === 0) {

                // update server with frequency as new minutes left 
                updatedMinutes = trainData[keys[i]].frequency;
                data.ref("/data").child(`${keys[i]}`).update({ "minutesAway": trainData[keys[i]].frequency });

                // calculate next train arrival using moment.JS
                // hh:mm A formates in 12 hour formate with AM or PM
                let lastArrival = moment(trainData[keys[i]].nextArrival, "hh:mm A");
                let newArrival = lastArrival.add(trainData[keys[i]].frequency, "minutes");

                // Update server value;
                data.ref("/data").child(`${keys[i]}`).update({ "nextArrival": newArrival.format("hh:mm A") });

                // Update displayed values
                $(`#${trainData[keys[i]].name}-min`).text(updatedMinutes);
                $(`#${trainData[keys[i]].name}-arrival`).text(newArrival.format("hh:mm A"));
            }
            else {
                // Update server value
                data.ref("/data").child(`${keys[i]}`).update({ "minutesAway": --updatedMinutes });
                // Update display value
                $(`#${trainData[keys[i]].name}-min`).text(updatedMinutes);
            }

        }

    });
}

// listener for changes to server user count
misc.on("value", function (snap) {
    let miscData = snap.val();

    // starts only if server connectins are 1 (prevents multiple clients from incrementing the counters)
    // Functionality for this might not work very well on longer intervals (ie if the clients do not stay on the 
    // browser long enough for the timer to elapse)
    if (miscData.connections === 1) {
        // runs every minute
        intervalID = setInterval(updateSavedData, 1000 * 60);
    }

})

// function to build rows and columns after user updates server
data.ref("/data").on("child_added", function (snapshot) {

    let savedData = snapshot.val();

    // Programatically builds rows and columns (Based upon Bootstrap 4)
    let newRow = $("<div>").addClass("row text-center top-border");
    let row1 = $("<div>").addClass("col-3").text(savedData.name).appendTo(newRow);
    let row2 = $("<div>").addClass("col-3").text(savedData.destination).appendTo(newRow);
    let row3 = $("<div>").addClass("col-2").text(savedData.frequency).appendTo(newRow);

    let row4 = $("<div>").addClass("col-2");

    row4.text(savedData.nextArrival)
    row4.attr("id", savedData.name + "-arrival");

    row4.appendTo(newRow);

    let row5 = $("<div>").addClass("col-2");
    row5.attr("id", savedData.name + "-min");

    row5.text(savedData.minutesAway).appendTo(newRow);

    newRow.appendTo($("#schedule-container"));

});

// function uses moment.JS to calculate the next train arrival from the user input
function calcNextArrival(first, freq) {
    let now = moment();

    let firstArrival = moment(first, "HH:mm");

    if (now.diff(firstArrival, "minutes") <= 0) { // first arrival hasn't occurred yet
        return firstArrival.format("hh:mm A");
    }
    else {
        // minutes between first arrival and now.
        let minuteSinceFirstArrival = now.diff(firstArrival, "minutes");
        // find number of minutes to next arrival
        let minutesToNextArrival = minuteSinceFirstArrival % freq;

        let nextArrival = now.add(minutesToNextArrival, 'minutes');

        return nextArrival.format("hh:mm A");
    }

}

function calcMinutesAway(nextTrain) {

    let now = moment();
    let nextTrainTime = moment(nextTrain, "hh:mm A");

    return nextTrainTime.diff(now, "minutes");

}

// function adds functionality to add data to server. Does not validate user input
$("#add-train").on("click", function (event) {
    event.preventDefault();

    let newTrain = {
        name: $("#train-name").val().trim(),
        destination: $("#destination").val().trim(),
        frequency: Number($("#frequency").val().trim()),
        firstTrain: $("#train-time").val().trim(),
        nextArrival: "00:00 AM",
        minutesAway: 0
    };

    newTrain.nextArrival = calcNextArrival(newTrain.firstTrain, newTrain.frequency);
    newTrain.minutesAway = calcMinutesAway(newTrain.nextArrival);

    data.ref("/data").push(newTrain);


});
