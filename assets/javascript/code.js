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

data.ref().on("child_added", function (snapshot) {

    let savedData = snapshot.val();

});

function calcNextArrival(first, freq) {
    let now = moment();

    let firstArrival = moment(first, "HH:mm");

    if (now.diff(firstArrival, "minutes") <= 0) { // first arrival hasn't occurred yet
        return firstArrival.format("hh:mm a");
    }
    else {
        // minutes between first arrival and now.
        let minuteSinceFirstArrival = now.diff(firstArrival,"minutes");
        let minutesToNextArrival = minuteSinceFirstArrival % freq;
        let nextArrival = now.add(minutesToNextArrival, 'minutes');

        return nextArrival.format ("hh:mm a");
    }

}

function calcMinutesAway(first, freq) {
    let now = moment();

    return freq;
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
    newTrain.minutesAway = calcMinutesAway(newTrain.firstTrain, newTrain.frequency);

    console.log(newTrain);

});
