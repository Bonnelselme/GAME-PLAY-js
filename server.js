var http = require("http");
var path = require("path");

var socketio = require("socket.io");
var express = require("express");
var qr = require("qr-image");
var room = require("./quizzjs/room/index.js");
var questionnaire = require("./quizzjs/questionnaire/index.js");

var router = express();
var server = http.createServer(router);
var io = socketio.listen(server);

var questions = require("./resources/questions.json");

/** Gestion des routes **/

/************************************************************************************************
 *                                    MODE DEBUG
 ************************************************************************************************
 * Log info : le nieau de log est paramétrable au niveau de node_modules/socket.io/lib/manager.js
 * ligne 74 : log level : 3 = error warn info debug
 *                        2 = error warn info
 *                        1 = error warn
 *                        0 = error
 **/

/** Home page.
 *   Cette page permet de diffuser le QRcode pour paramétrage du questionnaire
 *   @return url : l'url sur laquelle est diffusée les évènements
 *   @return token : le token référençant la page a accédée.
 *   @return ready2play : l'indicateur permettant de conditionnant le QRcode [true=>la partie est administrée, false=> en attente de paramétrage]
 **/
router.get("/", function (req, res) {
  //Création d'une nouvelle room
  var token = room.newRoom();
  var myRoom = room.getRoom(token);
  myRoom.open();

  res.render("index.ejs", {
    url: req.headers.host,
    token: token,
    ready2play: myRoom.isReady(),
  });
});

/** Génération du flux correspondant à l'image du QR Code pour rejoindre une partie paramétrée/
 *   L'image générée est à afficher pour rejoindre la room.
 *   @param token : identifiant de la salle à rejoindre.
 *   @return qrcode : image symbolisant une adresse de type /access-room/idToken
 **/
router.get("/access-room/:token", function (req, res) {
  var myRoom = room.getRoom(req.params.token);

  if (myRoom != false) {
    //On affiche l'url du site
    var urlQr =
      req.protocol + "://" + req.headers.host + "/room/" + req.params.token;
    var code = qr.image(urlQr, { type: "svg" });
    res.type("svg");
    code.pipe(res);
    console.log("qr-code affiché : " + urlQr);
  }
});

/** Génération du flux correspondant à l'image du QR Code pour rejoindre une partie paramétrée
 *   L'image générée est à afficher pour rejoindre la room.
 *   @param token : identifiant de la salle à paramétrer.
 *   @return qrcode : image symbolisant une adresse de type /admin-room/idToken
 **/
router.get("/admin-room/:token", function (req, res) {
  var myRoom = room.getRoom(req.params.token);

  if (myRoom != false) {
    //On affiche l'url du site
    var urlQr = req.headers.host + "/admin/" + req.params.token;
    var code = qr.image(urlQr, { type: "svg" });
    res.type("svg");
    code.pipe(res);
    console.log("qr-code affiché : " + urlQr);
  }
});

/** Admin page
 *   @param token : identifiant de la salle à paramétrer.
 *   @return url : url à intérargir pour les sockets
 *   @return room : id de la room à administrer (la valeur est forcée à false si une erreur est remontée)
 *   @return error : les erreurs à remonter en cas d'anomalie
 **/
router.get("/admin/:token", function (req, res) {
  var myRoom = room.getRoom(req.params.token);
  //res.render('admin.ejs', {url: req.headers.host});

  if (myRoom != false) {
    if (!room.getRoom(req.params.token).isReady()) {
      console.log("Welcome to room : [" + req.params.token + "]");
      myRoom.setName("Room : [" + req.params.token + "]");
      res.render("admin.ejs", {
        url: req.headers.host,
        token: req.params.token,
        error: null,
      });
    } else {
      console.log("La room est déjà paramétrée.");
      res.render("admin.ejs", {
        url: null,
        token: null,
        error: "La room est déjà paramétrée.",
      });
    }
  } else {
    console.log("La room n'existe pas.");
    res.render("admin.ejs", {
      url: null,
      token: null,
      error: "La room n'existe pas.",
    });
  }
});

/** User page
 *   @param token : identifiant de la salle à rejoindre.
 *   @return url : url à intérargir pour les sockets
 *   @return room : id de la room à administrer (la valeur est forcée à false si une erreur est remontée)
 *   @return error : les erreurs à remonter en cas d'anomalie
 **/
router.get("/room/:token", function (req, res) {
  var myRoom = room.getRoom(req.params.token);

  if (myRoom != false) {
    if (room.getRoom(req.params.token).isOpen()) {
      if (room.getRoom(req.params.token).isReady()) {
        console.log("Welcome to room : [" + req.params.token + "]");
        room
          .getRoom(req.params.token)
          .setName("Room : [" + req.params.token + "]");
        res.render("user.ejs", {
          url: req.headers.host,
          room: req.params.token,
          error: false,
        });
      } else {
        console.log("La room n'a pas encore configurée.");
        res.render("user.ejs", {
          url: false,
          room: false,
          error: "La room n'a pas encore configurée.",
        });
      }
    } else {
      console.log("La room n'est pas accessible.");
      res.render("user.ejs", {
        url: false,
        room: false,
        error: "La room n'est pas accessible.",
      });
    }
  } else {
    console.log("La room n'existe pas.");
    res.render("user.ejs", {
      url: false,
      room: false,
      error: "La room n'existe pas.",
    });
  }
});
/** Socket **/

// Quand un client se connecte, on le note dans la console
io.sockets.on("connection", function (socket) {
  // Socket de connexion d'un nouveau joueur.
  socket.on("user", function (data, fn) {
    console.log(
      "Inscription de : " + data["pseudo"] + " dans la room " + data["room"]
    );
    var userToken = room.getRoom(data["room"]).memberJoin();
    // Si le user est valide, on l'ajoute sur la page de la room.
    if (userToken) {
      //Sauvegarde du username et de la room dans la session
      socket.username = data["pseudo"];
      socket.room = data["room"];
      socket.token = userToken;
      socket.score = 0;

      socket.broadcast.emit("new-user-" + data["room"], {
        user: data["pseudo"],
        usertoken: userToken,
        nbUsers: room.getRoom(data["room"]).getMembers().length,
      });
    }

    if (!room.getRoom(data["room"]).notEnough()) {
      socket.broadcast.emit("start-party-room-" + data["room"]);
    }

    //Le token est retourné au client pour identifier les traitements
    fn({ userToken: userToken });
  });

  // Socket permettant l'administration de la salle.
  socket.on("param-room", function (data, fn) {
    if (room.getRoom(data["room"]) != false) {
      room.getRoom(data["room"]).setReady();
      room.getRoom(data["room"]).open();
      //--Parametrage
      room.getRoom(data["room"]).setMaxNbMembers(data["nbUsersMax"]);
      room.getRoom(data["room"]).setMinNbMembers(data["nbUsersMax"]);
      room.getRoom(data["room"]).setTimerQuestion(data["timerQuestion"]);

      //--Load questions si l'utilisateur en a saisi
      if (data["nbNouvellesQuestions"] > 0) {
        room.getRoom(data["room"]).setNbQuestions(data["nbQuestions"]);
        questionnaire.loadQuestionnaire(
          JSON.parse(data["nouvellesQuestions"]),
          data["room"]
        );
      } else {
        questionnaire.loadQuestionnaire(questions, data["room"]);
      }
      socket.broadcast.emit("create-room-" + data["room"], {
        nbUsersMax: data["nbUsersMax"],
        nbQuestions: data["nbQuestions"],
        timerQuestion: data["timerQuestion"],
      });

      fn({ url: "/room/" + data["room"] });
    } else {
      fn(false);
    }
  });

  // Socket permettant le lancement de la partie.
  socket.on("start", function (data, fn) {
    console.log("Debut de la party : " + data["room"]);
    room.getRoom(data["room"]).close();
    socket.broadcast.emit("cycle-question");
    fn(true);
  });

  // Socket d'écoute pour renvoyer une question aléa aux clients (index + user).
  socket.on("recup-question", function (data, fn) {
    var fluxQuestion = questionnaire
      .getQuestionnaire(data["room"])
      .getFluxQuestionAleatoire();
    socket.broadcast.emit("start-party-users-" + data["room"], fluxQuestion);
    fn(fluxQuestion);
  });

  socket.on("recolte-reponse", function (data, fn) {
    var point = 0;
    if (
      questionnaire
        .getQuestionnaire(socket.room)
        .checkResponse(data["id"], data["reponse"])
    ) {
      point = 1;
    }
    socket.broadcast.emit("maj-party-users-" + socket.room, {
      nbPoint: point,
      usertoken: socket.token,
    });
    fn(true);
  });

  //demander l'affichage des boutons reload sur User.ejs
  socket.on("display-reload-party", function (data, fn) {
    console.log(
      "serveur.js : fin de partie : affichage des boutons 'reload' pour la room " +
        socket.room
    );
    socket.broadcast.emit("reload-party-");
    fn(true);
  });

  //reinitialiser la partie.
  socket.on("reloadParty", function (data, fn) {
    console.log("serveur.js : reinit de la room " + socket.room);
    console.log("displayAdmin = " + data["displayAdmin"]);
    //Dans tous les cas on reinitialise le questionnaire.
    questionnaire.getQuestionnaire(socket.room).reinitialiserQuestionsPosees();

    if (data["displayAdmin"]) {
      //On affiche l'admin pour parametrer une nouvelle partie.
      room.getRoom(socket.room).setWaiting();
      socket.broadcast.emit("reloading-room-" + socket.room);
    } else {
      //On relance directement une partie sans rien changer.
      socket.broadcast.emit("start-party-room-" + socket.room);
    }
    fn({ room: socket.room });
  });

  //socket de deconnexion d'un joueur.
  socket.on("disconnect", function () {
    if (room.getRoom(socket.room) != false) {
      room.getRoom(socket.room).memberLeave(socket.token);

      socket.broadcast.emit("user-left-" + socket.room, {
        username: socket.username,
        usertoken: socket.token,
        nbUsers: room.getRoom(socket.room).getMembers().length,
      });
    }
  });
});

/** Serveur **/
server.listen(process.env.PORT, process.env.IP, function () {
  var addr = server.address();
  router.use(express.static(__dirname + "/public"));
  console.log("QuizzJS run to : [", addr.address + ":" + addr.port + "]");
});
