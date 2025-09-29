<?php 
// Incluir las clases de PHPMailer
require '../libs/phpmailer/PHPMailer.php';
require '../libs/phpmailer/SMTP.php';
require '../libs/phpmailer/Exception.php';
date_default_timezone_set('America/Santiago'); // Zona horaria de Chile

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

header('Content-Type: application/json'); // Especificar que la respuesta será JSON

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    // Variables de formulario
    $name = htmlspecialchars(trim($_POST['name']));
    $email = htmlspecialchars(trim($_POST['email']));
    $telefono = htmlspecialchars(trim($_POST['telefono']));
    $services = isset($_POST['services']) ? $_POST['services'] : [];
    $comments = htmlspecialchars(trim($_POST['comments']));
    $subject = htmlspecialchars(trim($_POST['subject']));


    // Validar datos del formulario
    if (empty($name) || empty($email) ||empty($telefono) || empty($comments) || empty($services) || empty($subject)) {
        echo json_encode([
            'status' => 'warning',
            'message' => 'Por favor complete todos los campos y seleccione al menos un servicio.'
        ]);
        exit;
    }
    if (!ctype_digit($telefono)) {
        echo json_encode([
            'status' => 'warning',
            'message' => 'Por favor ingrese un número de teléfono válido.'
        ]);
        exit;
    }

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        echo json_encode([
            'status' => 'warning',
            'message' => 'Por favor ingrese un correo válido.'
        ]);
        exit;
    }

    try {
        // Crear una nueva instancia de PHPMailer
        $mail = new PHPMailer(true);
        

        // Configuración del servidor SMTP
        $mail->isSMTP();
        $mail->Host = 'smtp.titan.email'; // Servidor SMTP
        $mail->SMTPAuth = true;
        $mail->Username = 'vinculacion@odscero.cl'; // Tu correo SMTP
        $mail->Password = 'Yi#wCC7[vs2cigS'; // Contraseña SMTP
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS; // Encriptación TLS
        $mail->Port = 587; // Puerto SMTP  

        // Configuración del correo
        $mail->setFrom("vinculacion@odscero.cl", "Formulario de contacto"); // Remitente
        $mail->addAddress('vinculacion@odscero.cl', 'Destinatario'); // Destinatario principal
        $mail->addAddress('vhicntjulio@gmail.com', 'Copia'); // Destinatario principal
        $mail->addReplyTo($email, $name); // Responder al remitente

        // Fecha y hora de la solicitud
        $date = date('Y-m-d H:i:s');
        // Incluir logo como imagen incrustada
        $logoPath = 'assets/images/logo_cabecera_blanco_1.png'; // Ruta al archivo del logo
        $logoCid = 'logo_cid'; // ID único para el logo
        
        // Formatear el Subject del correo
        $selectedServices = implode(", ", $services);
        
        
        // Contenido del mensaje
        $mail->isHTML(true);
        $mail->Subject = "Servicios interesados (" . $selectedServices . ")";
        $mail->Body = "
    <html>
    <head>
        <style>
            /* Estilos básicos para el diseño */
            .container {
                max-width: 600px;
                margin: 0 auto;
                font-family: Arial, sans-serif;
                color: #333;
                background-color: #f9f9f9;
                border-radius: 8px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                padding: 20px;
            }
            .header {
                text-align: center; /* Centrar contenido */
                background-color: #2ABAEB; /* Color de fondo */
                padding: 15px;
                border-top-left-radius: 8px;
                border-top-right-radius: 8px;
            }
            .header img {
                max-height: 50px;
                margin-bottom: 10px; /* Espacio entre logo y texto */
            }
            .header h1 {
                color: #ffffff; /* Texto blanco */
                margin: 0;
                font-size: 25px;
            }
            .content p {
                margin: 10px 0;
                line-height: 1.6;
            }
            .footer {
                text-align: center;
                margin-top: 20px;
                font-size: 12px;
                color: #666;
            }
        </style>
    </head>
    <body>
        <div class='container'>
            <div class='header'>
                <img src='https://odscero.cl/assets/images/ods0blanco.png' href='https://odscero.cl' alt='Logo'>
                <h1>Nuevo mensaje desde el formulario</h1>
            </div>
            <div class='content'>
                <p><strong>Fecha de la solicitud:</strong> " . date('d-m-Y') . "</p>
                <p><strong>Hora de la solicitud:</strong> " . date('h:i:s A') . "</p>
                <p><strong>Nombre:</strong> $name</p>
                <p><strong>Correo:</strong> $email</p>
                <p><strong>Asunto:</strong> $subject</p>
                <p><strong>Servicios interesados:</strong> " . implode(", ", $services) . "</p>
                <p><strong>Comentario:</strong></p>
                <p>$comments</p>
            </div>
            <div class='footer'>
                <p>https://www.odscero.cl</p>
            </div>
        </div>
    </body>
</html>
";

 // Enviar correo al administrador
 $mail->send();

 // Configuración para el correo de confirmación al usuario
 $mail->clearAddresses(); // Limpiar direcciones anteriores
 $mail->addAddress($email,$telefono,$name); // Destinatario del correo de confirmación
 $mail->CharSet = 'UTF-8';
 $mail->Subject = "¡Recibimos tu correo!";
 $mail->Body = "
<html>
<head>
    <style>
        /* Estilos básicos para el diseño */
        .container {
            max-width: 600px;
            margin: 0 auto;
            font-family: Arial, sans-serif;
            color: #333;
            background-color: #f9f9f9;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            padding: 20px;
        }
        .header {
            text-align: center; /* Centrar contenido */
            background-color: #2ABAEB; /* Color de fondo */
            padding: 15px;
            border-top-left-radius: 8px;
            border-top-right-radius: 8px;
        }
        .header img {
            max-height: 50px;
            margin-bottom: 10px; /* Espacio entre logo y texto */
        }
        .header h1 {
            color: #ffffff; /* Texto blanco */
            margin: 0;
            font-size: 25px;
        }
        .content p {
            margin: 10px 0;
            line-height: 1.6;
        }
        .footer {
            text-align: center;
            margin-top: 20px;
            font-size: 12px;
            color: #666;
        }
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <img src='https://odscero.cl/assets/images/ods0blanco.png' href='https://odscero.cl' alt='Logo'>
            <h1>¡Gracias por contactarnos!</h1>
        </div>
        <div class='content'>
            <p>Estimado/a $name,</p>
            <p>Hemos recibido su consulta y nuestro equipo está trabajando para atenderla. Un agente se pondrá en contacto con usted lo antes posible.</p>
        </div>
        <div class='footer'>
            <p>https://www.odscero.cl</p>
        </div>
    </div>
</body>
</html>
 ";


        // Enviar correo
        $mail->send();
        echo json_encode([
            'status' => 'success',
            'message' => '¡Mensaje enviado exitosamente!'
        ]);
    } catch (Exception $e) {
        echo json_encode([
            'status' => 'danger',
            'message' => 'Hubo un problema al enviar el mensaje. Intente de nuevo más tarde.'
        ]);
    }
} else {
    echo json_encode([
        'status' => 'warning',
        'message' => 'Solicitud no válida.'
    ]);
}
