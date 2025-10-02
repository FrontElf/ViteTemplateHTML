<?php

require_once 'mailer-config.php';


$mail->Body = '<ul>';
foreach ($_POST as $key => $value) {
	$mail->Body .= '<li>' . htmlspecialchars($key) . ': ' . htmlspecialchars($value) . '</li>';
}
$mail->Body .= '</ul>';


if (! $mail->send()) {
	$message = 'Помилка';
} else {
	$message = 'Дані надіслані!';
}

$response = ['message' => $message];



header('Content-type: application/json');
echo json_encode($response);
