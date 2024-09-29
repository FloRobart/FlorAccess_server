<!DOCTYPE html>
<html>
<head>
    <title>Email personnalisé</title>
</head>
<body>
    <h1>{{ $data['title'] }}</h1>
    <p>{{ $data['message'] }}</p>
    <p>Merci,</p>
    <p>{{ $data['sender_name'] }}</p>
</body>
</html>
