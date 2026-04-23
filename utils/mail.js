import Mailgen from "mailgen";
import nodemailer from "nodemailer";

const sendEmail = async (options) => {
const mailGenertaor = new Mailgen({
  theme: "default",
  product: {
    name: "Expense Tracker",
    link: "http://localhost:3000"
  }
});

 const emailtext =   mailGenertaor.generatePlaintext(options.mailgenContent);
 const emailHtml =  mailGenertaor.generate(options.mailgenContent);


 const transporter = nodemailer.createTransport({
  service : "gmail",
    auth : {
        user :  process.env.EMAIL_USER,
        pass :  process.env.EMAIL_PASS

    }
 });

const mail = {
    from : "mail.taskmanager@example.com",
    to: options.email,
    subject: options.subject,
    text: emailtext,
    html: emailHtml
}

try {
    await transporter.sendMail(mail);
} catch (error) {
    console.error("email service failed" , error);
}


}

const emailContent = (username) => {
  return {
    body: {
        name : username,
        intro: `Welcome ${username} to our Expense Tracking App ! we are exicited to have 
        you on board`,
        action:{
              button: {
              color: "green",
              text: `Welcome ${username} , login link`,
              link : `http://localhost:4200/login`
        }
        }
    }
  }
}
export {emailContent , sendEmail};