<?php


// Sanitize & Validate Input
function clean_input($data) {
    return htmlspecialchars(strip_tags(trim($data)));
}

header('Content-Type: application/json');

$name = isset($_POST['name']) ? clean_input($_POST['name']) : '';
$email = filter_var($_POST['email'] ?? '', FILTER_VALIDATE_EMAIL);
if (!$email) {
    echo json_encode(['success' => false, 'message' => 'Invalid email']);
    exit;
}
$phone = isset($_POST['phone']) ? clean_input($_POST['phone']) : '';
$topic = isset($_POST['topic']) ? clean_input($_POST['topic']) : '';
$message = isset($_POST['message']) ? clean_input($_POST['message']) : '';

// Email Configuration
$recipient = "arun@orangy.design"; // Change this to your email
$subject = "New Contact Form Submission";
// From must be a mailbox on this server's own domain, or most mail
// providers (Gmail, etc.) will silently drop the message as spoofed
// since it fails SPF/DKIM alignment. The visitor's address goes in
// Reply-To instead so replies still go to them.
$sendingDomain = $_SERVER['SERVER_NAME'] ?? 'tacbot.com';
$headers = "From: Tacbot Contact Form <no-reply@$sendingDomain>\r\n";
$headers .= "Reply-To: $name <$email>\r\n";
$headers .= "Content-Type: text/plain; charset=UTF-8\r\n";

// Email Body
$body = "You have received a new message:\n\n";
$body .= "Name: $name\n";
$body .= "Email: $email\n";
$body .= "Phone: $phone\n";
$body .= "Topic: $topic\n";
$body .= "Message:\n$message\n";

// Send the email
if (mail($recipient, $subject, $body, $headers)) {
    echo json_encode(['success' => true]);
} else {
    echo json_encode(['success' => false, 'message' => 'Error sending message. Please try again later.']);
}




?>