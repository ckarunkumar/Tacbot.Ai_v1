<?php
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method Not Allowed']);
    exit;
}

// Retrieve and sanitize input fields
$name = isset($_POST['name']) ? strip_tags(trim($_POST['name'])) : '';
$email = isset($_POST['email']) ? filter_var(trim($_POST['email']), FILTER_SANITIZE_EMAIL) : '';
$company = isset($_POST['company']) ? strip_tags(trim($_POST['company'])) : '';
$topic = isset($_POST['topic']) ? strip_tags(trim($_POST['topic'])) : '';
$message = isset($_POST['message']) ? strip_tags(trim($_POST['message'])) : '';

// Validate required fields
if (empty($name) || empty($email) || empty($message)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Please fill in all required fields.']);
    exit;
}

// Validate email format
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Please enter a valid email address.']);
    exit;
}

// Recipient email configuration
$to = 'info@tacbot.com';

// Subject
$subject = "New message from Tacbot contact form: $topic";

// Email Body
$email_content = "Name: $name\n";
$email_content .= "Email: $email\n";
$email_content .= "Company: $company\n";
$email_content .= "Topic: $topic\n\n";
$email_content .= "Message:\n$message\n";

// Headers
$headers = [];
$headers[] = 'MIME-Version: 1.0';
$headers[] = 'Content-type: text/plain; charset=utf-8';
$headers[] = 'From: Tacbot Form <no-reply@tacbot.com>';
$headers[] = "Reply-To: $name <$email>";


// Send Email
$mail_sent = @mail($to, $subject, $email_content, implode("\r\n", $headers));

if ($mail_sent) {
    echo json_encode(['success' => true]);
} else {
    $error = error_get_last();
    $err_msg = isset($error['message']) ? $error['message'] : 'PHP mail() function failed. Make sure your server is configured to send mail (SMTP/sendmail).';
    
    // Log the error locally for debugging
    error_log("[" . date('Y-m-d H:i:s') . "] Mail failed: " . $err_msg . "\n", 3, __DIR__ . '/contact_error.log');
    
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $err_msg]);
}
?>