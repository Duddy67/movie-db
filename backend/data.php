<?php
/*
 * Bogus backend that simulates the basic operations required to 
 * connect a user to the application and fetch their tmdb api key.
 */

function Redirect($url, $permanent = false)
{
    header('Location: ' . $url, true, $permanent ? 301 : 302);
    exit();
}

// Call the appropriate function.
if (isset($_POST['login'])) {
    login();
}
elseif (isset($_SERVER['HTTP_AUTHORIZATION'])) {
    getApiKey();
}

function login()
{
    // Simulate a verification against a bogus user account. 

    $credentials = ['login' => 'john.doe@domain.com', 'passwd' => 'secret'];

    if ($_POST['login'] != $credentials['login'] && $_POST['passwd'] != $credentials['passwd']) {
        Redirect('https://'.$_SERVER['HTTP_HOST'].'/tvshow-db/login.php?invalid_credentials');
    } 

    // Create the token.
    $token = uniqid();
    // Store the token in a cookie.
    setcookie('auth_token', $token, time() + (86400 * 30), '/');

    // Simulate a query that store the token value in database.
    $file = fopen('authtoken.txt', 'w');
    fwrite($file, $token);
    fclose($file);

    // Redirect to the TvShowDB application.
    Redirect('https://'.$_SERVER['HTTP_HOST'].'/tvshow-db');
}

function getApiKey()
{
    // Get the given authorization token.
    $authorization = str_replace('Bearer ', '', $_SERVER['HTTP_AUTHORIZATION']);

    // Check the user's token.
    if ($authorization != file_get_contents('authtoken.txt', true)) {
        echo 'Error: 403 unauthorized.';
    }
    else {
        // Simulate a connection to the tmdb api that returns the user's api key.
        echo file_get_contents('apikey.txt', true);
    }
}

?>
