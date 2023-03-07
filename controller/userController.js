const fs = require("fs");
const request = require("request");
const path = require("path");
var nodemailer = require('nodemailer');
const amqp = require("amqplib");

const UserModel = require("../models/user");

const avatar_directory = path.join(path.dirname(__dirname), "avatars");

const  sendEmail=async (to,subject,text)=>{
  var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'soemthing@gmail.com',
      pass: 'soemthing'
    }
  });
  
  var mailOptions = {
    from: 'soemthing@gmail.com',
    to: to,
    subject,
    text
  };
  
   

  transporter.sendMail(mailOptions, function(error, info){
    if (error) {
      console.log(error);
    } else {
      console.log('Email sent: ' + info.response);
    }
  });

  // send data to queue via rabbitmq
  let data={
    'type':'email',
    'to':to,
    'status':'success'
  }
  // let connection = await amqp.connect("amqp://localhost:5672");
  // let channel    = await connection.createChannel()
  // await channel.sendToQueue("emails", Buffer.from(JSON.stringify(data)));
  // await channel.close();
  // await connection.close(); 
}
/**
 *  creates a new user
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
const createUser = async (req, res, next) => {
  const avatar_url = req.body.avatar;
  try {
    //If Avatar sent by user gets base64 from url
    if (avatar_url) {
      image_data = await new Promise(async (resolve, reject) => {
        await request.get(
          { url: req.body.avatar, encoding: "binary" },
          function (err, response, body) {
            base64 =
              "data:" +
              response.headers["content-type"] +
              ";base64," +
              Buffer.from(body).toString("base64");
            resolve({
              base64,
              raw_data: body,
              content_type: response.headers["content-type"],
              file_type: path.extname(avatar_url),
            });
          }
        );
      });
      req.body.avatar = image_data.base64;
      req.body.content_type = image_data.content_type;
      req.body.file_type = image_data.file_type;
    }

    //Hashing password
    req.body.password = UserModel.hashPassword(req.body.password);

    let user = await UserModel.create(req.body);
    if (user) {
      let user_id = user._id.toString();
      if (avatar_url) {
        let file_extension = path.extname(avatar_url);
        //write to storage
        fs.writeFile(
          path.join(avatar_directory, user_id + file_extension),
          image_data.raw_data,
          "binary",
          function (err) {
            if (err) console.log(err);
          }
        );
      }

      //Send email
      //I commented this line due to privacy issues
      sendEmail(req.body.email_address,'Welcome to Our website','Welcome '+ req.body.first_name + '! You registered successfully');

      res
        .status(200)
        .json({ result: "success", message: "User created successfully" });
    } else {
      res
        .status(400)
        .json({ result: "error", message: "Error in creating user" });
    }
  } catch (e) {
    console.error(e);
    res.status(500).json({ result: "error", message: "Bad server error" });
  }
};

/**
 * get user data
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
const getUser = async (req, res, next) => {
  try {
    var user = await UserModel.findById(req.params.userId);
    if (user) {
      //remove password
      user.password = undefined;

      res.status(200).json({
        result: "success",
        message: "User found successfully",
        data: { user },
      });
    } else {
      res.status(404).json({ result: "error", message: "User not found" });
    }
  } catch (e) {
    console.log(e);
    res.status(500).json({ result: "error", message: "Bad server error" });
  }
};

/***
 *  show avatar
 */
const showAvatar = async (req, res, next) => {
  var user = await UserModel.findById(req.params.userId);
  if (user) {
    let base64Image = user.avatar.split(";base64,").pop();
    res.writeHead(200, { "Content-Type": user.content_type });
    let bsae64 = fs.readFileSync(
      path.join(avatar_directory, user._id.toString()) +
        user.file_type
    );
    res.end(Buffer.from(bsae64, "base64"));
  } else {
    res.status(404).json({ result: "error", message: "User not found" });
  }
};

/**
 *  remove avatar from storage and db collection
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
const removeAvatar = async (req, res, next) => {
  var user = await UserModel.findById(req.params.userId);
  if (user) {
    let file_path=path.join(avatar_directory, user._id.toString() +
    user.file_type)
    if (file_path) {
      fs.unlinkSync(file_path);
       await UserModel.findByIdAndUpdate(req.params.userId, {
        avatar: null,
        content_type: null,
        file_type: null,
      });
      return res
      .status(204)
      .json({ result: "success", message: "Avatar is deleted succesfuly" });
    } else {
      return res.status(404).json({ result: "error", message: "Avatar not found" });
    }
 
  } else {
    return res.status(404).json({ result: "error", message: "User not found" });
  }
};

module.exports = { createUser, getUser, showAvatar, removeAvatar };