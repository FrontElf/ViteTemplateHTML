<?php

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require 'phpmailer/src/Exception.php';
require 'phpmailer/src/PHPMailer.php';
require 'phpmailer/src/SMTP.php';

$mail = new PHPMailer(true);
$mail->CharSet = 'UTF-8';
$mail->setLanguage('ru', 'phpmailer/language/');
$mail->IsHTML(true);


$mail->isSMTP();
$mail->Host = 'smtp.gmail.com';
$mail->SMTPAuth = true;
$mail->Username = 'grafvishna4@gmail.com';
$mail->Password = 'uontlhvsonreobdd';
$mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
$mail->Port = 465;


//Від кого лист
$mail->setFrom('grafvishna4@gmail.com', 'Юзер');
//Кому відправити
$mail->addAddress('no@muuuu.uno');
//Тема листа
$mail->Subject = 'Тест PHP серверу"';
