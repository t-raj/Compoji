(function () {
  $(document).on("pageinit", "#login", function(e) {
		//prevent any bound defaults
		e.preventDefault();
		//loader function after deviceready event returns
		function onDeviceReady() {
      var pets = [];
      var petQuantity = -1; //make this = pets.length or appt. array method
      var lastUpdate;
      var feedTimes = { //user changeable feeding times throughout the day, stored as integer minutes since 12:00am
        morning: 540, //9am
        evening: 1080 //7:20pm
      };
      var imageTemp;

      //use indexedDB to retrieve these values on launch
      var currentPet = -1;
      //var tick = window.setInterval(onTick, 10000);

      function onLaunch(){ //maybe try putting things in backwards order if it doesn't work
        var petString = localStorage.getItem("pets");
        pets = JSON.parse(petString);
        loadPets(pets);
      }

      function onTick(){
        var date = new Date();
        UpdatePets(date);
      }

      function LastFed(){
        this.date = "";
        this.year = "";
        this.month = "";
        this.date = "";
        this.day = "";
        this.hour = "";
        this.minute = "";
        this.morning = "";
        this.status = -1;   //integer value 0 for good, 1 for neutral, 2 for missed action
      }

      function Pet(name, photo, id){
        this.name = name;
        this.photo = photo;
        this.id = id;
        this.lastFed = new LastFed();
      }

      Pet.prototype.needsAction = function() {
        this.lastFed.status = 2;
        $("#pet" + this.id).removeClass("green");
        $("#pet" + this.id).removeClass("yellow");
        $("#pet" + this.id).addClass("red");
      };
      Pet.prototype.neutral = function() {
        this.lastFed.status = 1;
        $("#pet" + this.id).removeClass("red");
        $("#pet" + this.id).removeClass("green");
        $("#pet" + this.id).addClass("yellow");
      };
      Pet.prototype.fed = function() {
        this.lastFed.status = 0;
        $("#pet" + this.id).removeClass("red");
        $("#pet" + this.id).removeClass("yellow");
        $("#pet" + this.id).addClass("green");
      };

      function UpdatePetStatus(currentDate) {
          var currentTime = 60*currentDate.getHours() + currentDate.getMinutes();
          var morning;
          if ((Math.abs(currentTime-feedTimes.morning)) < (Math.abs(currentTime-feedTimes.evening))) {
            morning = true;
          }
          else if ((Math.abs(currentTime-feedTimes.morning)) > (Math.abs(currentTime-feedTimes.evening))){
            morning = false;
          }
          var pastFeedTime;
          switch (morning){
            case true: //if it's morning
              if (currentTime > feedTimes.morning){ //if it's past morning feed time
                pastFeedTime = true;
              }
              else if (currentTime < feedTimes.morning){ //if it's before morning feed time
                pastFeedTime = false;
              }
              for (i=0;i<pets.length;i+=1) {  //for each pet
                if (pastFeedTime && (pets[i].lastFed.date !== currentDate.getDate())) { //if past feed time and pet has not been fed today
                  pets[i].needsAction(); //pet needs to be fed
                }
                else if (pets[i].lastFed.date === currentDate.getDate()) { //if pet has been fed today and it's morning the pet is okay
                  pets[i].fed();
                }
                else if (!pastFeedTime && !pets[i].lastFed.morning) { //if it's not past feed time and it hasn't been fed this morning
                  pets[i].neutral();
                }
              }
              break;
            case false: //if it's evening
              if (currentTime > feedTimes.evening) { //if it's past evening feed time
                pastFeedTime = true;
              }
              else if (currentTime < feedTimes.evening) { //if it's before evening feed time
                pastFeedTime = false;
              }
              for (i=0;i<pets.length;i+=1) {
                if (pastFeedTime && (pets[i].lastFed.date === currentDate.getDate())) { //if past feed time and pet has been fed today
                  if (pets[i].lastFed.morning) { //if pet hasn't been fed this evening
                    pets[i].needsAction();  //pet needs to be fed
                  }
                  else { //if pet was fed this evening
                    pets[i].fed();
                  }
                }
                else if (pets[i].lastFed.date !== currentDate.getDate()) { //if pet was not fed today
                  pets[i].needsAction();
                }
                else if (!pastFeedTime && ((pets[i].lastFed.date === currentDate.getDate()) && pets[i].lastFed.morning)) {
                  pets[i].neutral();
                }
              }
              break;
          }
      }

      function addPet() {
        $("#addPet").popup("close");
        petQuantity += 1;
        var id = petQuantity;
        var name = $("#newPetName").val();
        var photo = imageTemp;
        pets[id] = new Pet(name,photo,id);
        $("#insert").append("<div class='pet green' id='pet" + id + "'> <img src=" + photo + " /> </div>");
      }

      function loadPet(pet) {
        $("#insert").append("<div class='pet green' id='pet" + pet.id + "'> <img src=" + pet.photo + " /> </div>");
      }

      function loadPets(pets) {
        var quant = pets.length;
        for (i=0;i<quant;i+=1){
          loadPet(pets[i]);
        }
      }

      function testAddPet(name) {
        petQuantity += 1;
        var id = petQuantity;
        pets[id] = new Pet(name,photo,id);
        $("#insert").append("<div class='pet green' id='pet" + id + "'> <img src='img/images-" + id + ".jpg' /> </div>");
        $("#addPet").popup("close");
      }

      function FeedDialog(id) {
        $("#confirmHeader h1").html(pets[id].name);
        if(pets[id].lastFed.hour == ""){
          $("#lastfed").html("");
        } else {
          if (pets[id].lastFed.hour > 12){
            pets[id].lastFed.hour -= 12;
            $("#lastfed").html("Last fed: "+ pets[id].lastFed.day + " - " + pets[id].lastFed.hour + ":" + pets[id].lastFed.minute + "pm");
          } else if (pets[id].lastFed.hour === 12){
            $("#lastfed").html("Last fed: "+ pets[id].lastFed.day + " - " + pets[id].lastFed.hour + ":" + pets[id].lastFed.minute + "pm");
          } else {
            $("#lastfed").html("Last fed: "+ pets[id].lastFed.day + " - " + pets[id].lastFed.hour + ":" + pets[id].lastFed.minute + "am");
          }
        }
        //$("#lastfed").html("Last fed: " + pets[id].lastFed.hour +":"+ pets[id].lastFed.minute + " // "+ pets[id].lastFed.day);
        $("#confirm").popup("open");
      }

      function Feed(id) {
        var date = new Date();
        pets[id].lastFed = UpdateLastFed(date);
        pets[id].fed();
        $("#lastfed").html("Last fed: just now");
        $("#confirm").popup("close");
      }

      function testFeed(id, date) {
        pets[id].lastFed = UpdateLastFed(date);
        $("#lastfed").html("Last fed: just now");
      }

      function UpdateLastFed(date) {
        var currentTime = 60 * date.getHours() + date.getMinutes();
        var newLastFed = new LastFed();
        newLastFed.date = date;
        newLastFed.year = date.getFullYear();
        newLastFed.month = date.getMonth();
        switch(newLastFed.month) {
          case 0:
            newLastFed.month = "January";
            break;
          case 1:
            newLastFed.month = "February";
            break;
          case 2:
            newLastFed.month = "March";
            break;
          case 3:
            newLastFed.month = "April";
            break;
          case 4:
            newLastFed.month = "May";
            break;
          case 5:
            newLastFed.month = "June";
            break;
          case 6:
            newLastFed.month = "July";
            break;
          case 7:
            newLastFed.month = "August";
            break;
          case 8:
            newLastFed.month = "September";
            break;
          case 9:
            newLastFed.month = "October";
            break;
          case 10:
            newLastFed.month = "November";
            break;
          case 11:
            newLastFed.month = "December";
            break;
        }
        newLastFed.date = date.getDate();
        newLastFed.day = date.getDay();
        switch(newLastFed.day) {
          case 0:
            newLastFed.day = "Sunday";
            break;
          case 1:
            newLastFed.day = "Monday";
            break;
          case 2:
            newLastFed.day = "Tuesday";
            break;
          case 3:
            newLastFed.day = "Wednesday";
            break;
          case 4:
            newLastFed.day = "Thursday";
            break;
          case 5:
            newLastFed.day = "Friday";
            break;
          case 6:
            newLastFed.day = "Saturday";
            break;
        }

        newLastFed.hour = date.getHours();

        newLastFed.minute = date.getMinutes();
        if(newLastFed.minute<= 9){
          //alert("Lastfed < 9");
          newLastFed.minute = "0"+newLastFed.minute.toString();
          parseInt(newLastFed.minute);
        }
        else{
          newLastFed.minute= date.getMinutes();
        }

        if ((Math.abs(currentTime-feedTimes.morning)) < (Math.abs(currentTime-feedTimes.evening))) {
          newLastFed.morning = true;
        }
        else if ((Math.abs(currentTime-feedTimes.morning)) > (Math.abs(currentTime-feedTimes.evening))){
          newLastFed.morning = false;
        }
        return newLastFed;
      }

      function onSuccess(imageData){
        imageTemp = imageData;
        $("body").pagecontainer("change", "#home", {transition: "fade"});
        // $('body').on('pagecontainerload', function( event, ui ) {
        //   if(ui.toPage[0] == $('#home')[0]) {
        //     //$("#insert").append(ui.prevPage[0].id);
        //     $("#addPet").popup("open");
        //   }
        // });
        setTimeout(function(){ $("#addPet").popup("open") },2000);
      }

      function onFail(message){
        navigator.notification.alert("Failed because: " + message);
      }

      function onPause(){
        var stringThis = JSON.stringify(pets);
        localStorage.setItem("pets",stringThis);
        //alert(stringThis);
        //alert("Storing pets");
      }

      function onResume(){
        //navigator.notification.alert("Resuming now....");
        var petString = localStorage.getItem("pets");
        //alert(pet1);
        pets = JSON.parse(petString);
        loadPets(pets);
        //alert(pets);
      }

      //dev tools functions
      function genPets(){
        var date1, date2, current;
        testAddPet("Jack");
        date1 = new Date('December 1, 2015 17:00:00');
        testFeed(0, date1);
        testAddPet("Goob");
        date2 = new Date('December 2, 2015 09:00:00');
        testFeed(1, date2);
        current = new Date();
        UpdatePetStatus(current);
      }

      function clearLS(){
        localStorage.setItem("pets","");
      }
      function clearDOM(){
        $("insert").html("");
      }
      function savetoLS(){
        var stringThis = JSON.stringify(pets);
        localStorage.setItem("pets",stringThis);
      }
      function loadfromLS(){
        var petString = localStorage.getItem("pets");
        pets = JSON.parse(petString);
      }

      // $('body').on('pagecontainerload', function( event, ui ) {
      //   if(ui.toPage[0] == $('#home')[0]) {
      //     //$("#insert").append(ui.prevPage[0].id);
      //     $("#addPet").popup("open");
      //   }
      //   // if ( ui.prevPage[ 0 ].id == "#camera" && ui.toPage[ 0 ].id == "#home" ) {
      //   //   $("#addPet").popup("open");
      //   // }
      // });


      $("#addPetConfirm").on("tap", function(e){
        addPet();
      });

      $(".pets").on("tap", ".pet", function(e){
        e.preventDefault();
        currentPet = parseInt($(this).attr("id").substring(3));
        FeedDialog(currentPet);
      });

      $("#feed").on("tap", function(e){
        Feed(currentPet);
      });

      $("#cameraPhoto").on("tap",function(e){
          e.preventDefault();
          //$("#photoSelector").popup("close");
          navigator.camera.getPicture(onSuccess, onFail, {
            quality: 60,
            sourceType: Camera.PictureSourceType.CAMERA,
            destinationType: Camera.DestinationType.FILE_URI,
            correctOrientation: true
          });
      });

      $("#galleryPhoto").on("tap",function(e){
        e.preventDefault();
        //$("#photoSelector").popup("close");
        navigator.camera.getPicture(onSuccess,onFail,{
          sourceType: Camera.PictureSourceType.PHOTOLIBRARY,
          destinationType: Camera.DestinationType.FILE_URI
        });
      });

      $("#save").on("tap",function(e){
        alert(petString[0]);

      });

      //dev tools e handlers
      $("#tester").on("tap", function(e){
        genPets();
      });

      $("#clearLS").on("tap", function(e){
        clearLS();
      });

      $("#clearDOM").on("tap", function(e){
        clearDOM();
      });

      $("#savetoLS").on("tap", function(e){
        savetoLS();
      });

      $("#loadfromLS").on("tap", function(e){
        loadfromLS();
      });

      $("#loadDOM").on("tap", function(e){
        loadPets(pets);
      });

      $(document).on("pause",onPause);
      $(document).on("resume",onResume);
      onLaunch();
    }
    		//as deviceready returns load onDeviceReady()
    $(document).on("deviceready", onDeviceReady);


  });

})();
