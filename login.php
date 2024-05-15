<!DOCTYPE html>
<html lang="en">
  <head>
     <meta charset="UTF-8">
     <meta name="viewport" content="width=device-width, initial-scale=1.0">
     <title>TvShows Backend</title>
     <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-T3c6CoIi6uLrA9TneNEoa7RxnatzjcDSCmG1MXxSR1GAsXEV/Dwwykc2MPK8M2HN" crossorigin="anonymous" />
     <link rel="stylesheet" href="css/style.css">
  </head>
  <body>
      <div class="container pt-5">
          <?php if (!isset($_COOKIE['auth_token'])) : ?>
              <form method="post" action="backend/data.php">
                  <div class="row mb-3">
                      <label for="login">Login</label>
                      <input type="text" name="login" id="login" class="form-control" value="">
                  </div>
                  <div class="row mb-5">
                      <label for="passwd">Password</label>
                      <input type="password" name="passwd" id="passwd" class="form-control" value="">
                  </div>
                  <div class="row">
                      <div class="col-md-4">
                          <button type="submit" class="btn btn-success">Login</button>
                      </div>
                  </div>
              </form>
              <?php if (isset($_GET['invalid_credentials'])) : ?>
                  <div class="row mt-5">
                      <div class="alert alert-danger text-center">
                          Invalid credentials
                      </div>
                  </div>
              <?php endif; ?>
          <?php else : ?>
              <div class="row mb-5">
                  <div class="">You're already logged in.</div>
                  <a href="<?php echo 'https://'.$_SERVER['HTTP_HOST'].'/tvshow-db'; ?>" class="btn btn-success">Return</a>
              </div>
          <?php endif; ?>
      </div>
  </body>
</html>
