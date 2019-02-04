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

connections.on("value", function (snapshot) {
    if (snapshot.val()) {
        let connections = 1;

        misc.once('value', function (miscSnap) {
            if (miscSnap.val() === null) {
                misc.set({
                    "connections": 1,
                    "timer": true
                });
            } else {
                connections = miscSnap.val().connections;
                misc.set({ "connections": ++connections });
            }
            misc.onDisconnect().set({
                "connections": --connections,
                "timer": false
            });
        })
    }
});

misc.on("value", function (snap) {
    let miscData = snap.val();
    if (miscData.timer === undefined) {
        misc.update({ "timer": true });
        setTimeout(function () {
            console.log("timer started");
        }, 1000)
    }
})

data.ref("/data").on("child_added", function (snapshot) {

    let savedData = snapshot.val();

    let newRow = $("<div>").addClass("row text-center top-border");
    let row1 = $("<div>").addClass("col-3").text(savedData.name).appendTo(newRow);
    let row2 = $("<div>").addClass("col-3").text(savedData.destination).appendTo(newRow);
    let row3 = $("<div>").addClass("col-2").text(savedData.frequency).appendTo(newRow);
    let row4 = $("<div>").addClass("col-2").text(savedData.nextArrival).appendTo(newRow);
    let row5 = $("<div>").addClass("col-2").text(savedData.minutesAway).appendTo(newRow);

    newRow.appendTo($("#schedule-container"));

});

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
    let nextTrainTime = moment(nextTrain, "hh:mm a");

    return nextTrainTime.diff(now, "minutes");

}

$("#add-train").on("click", function (event) {
    event.preventDefault();

    let newTrain = {
        name: $("#train-name").val().trim(),
        destination: $("#destination").val().trim(),
        frequency: $("#frequency").val().trim(),
        firstTrain: $("#train-time").val().trim(),
        nextArrival: "00:00 AM",
        minutesAway: 0
    };

    newTrain.nextArrival = calcNextArrival(newTrain.firstTrain, newTrain.frequency);
    newTrain.minutesAway = calcMinutesAway(newTrain.nextArrival);

    data.ref("/data").push(newTrain);

});
