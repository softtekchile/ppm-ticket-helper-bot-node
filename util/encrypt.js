var forge = require('node-forge');

var encryptTest = function(text){
    var plaintext = text;  
    var key = 'mykey@91mykey@91';
    var iv = 'AODVNUASDNVVAOVF';
    
    console.log('Plain Text: ' + plaintext); 
    
    var cipher = forge.cipher.createCipher('AES-CBC', key);
    cipher.start({iv: iv});
    cipher.update(forge.util.createBuffer(plaintext));
    cipher.finish();
    var encrypted = cipher.output;
    
    var encodedB64 = forge.util.encode64(encrypted.data);
    console.log("Encoded: " + encodedB64);
    
    var decodedB64 = forge.util.decode64(encodedB64);
    encrypted.data = decodedB64;
    
    var decipher = forge.cipher.createDecipher('AES-CBC', key);
    decipher.start({iv: iv});
    decipher.update(encrypted);
    var result = decipher.finish(); 
    console.log("Decoded: " + decipher.output.data);
    return encodedB64;
}

module.exports.encryptTest = encryptTest;