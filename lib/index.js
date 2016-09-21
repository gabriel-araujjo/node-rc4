const Transform = require('stream').Transform;
const util = require('util');
const Buffer = require('buffer').Buffer;

const defaults = {
    keyEnc: 'utf-8',
};

const blockLength = 256;

function Rc4Stream(options) {
    if (!(this instanceof Rc4Stream))
        return new Rc4Stream(options);
        
    options = Object.assign({}, defaults, options);
    
    Transform.call(this, options);
    
    var key = options.key;
    
    if (!key || key.length == 0)
        throw new Error("key is mandatory");

    key = Buffer.from(options.key, options.enc)

    if (key.length > blockLength)
        throw new Error("key too long, max of " + blockLength + " bytes");
    
    this.initializeFlowGenerator(key);
}

util.inherits(Rc4Stream, Transform);

Rc4Stream.prototype._transform = function (chunk, enc, cb) {
    var buf = Buffer.from(chunk, enc);
    for(var i = 0; i < buf.length; i++) {
        buf[i] ^= this._nextK();
    }
    this.push(buf);
    cb();
};


Rc4Stream.prototype._nextK = function() {
    var i = this._i;
    var j = this._j;
    var s = this._s;
    var t;
    i = (i + 1) % blockLength;
    j = (j + s[i]) % blockLength;
    // swap s[i], s[j]
    s[i] ^= s[j];
    s[j] ^= s[i];
    s[i] ^= s[j];
    t = (s[i] + s[j]) % blockLength;
    
    this._i = i;
    this._j = j;
    return s[t];
};

Rc4Stream.prototype.initializeFlowGenerator = function(key) {
    var keyLength = key.length;
    var s = Buffer.alloc(blockLength);
    
    for (var i = 0; i < blockLength; i++) {
        s[i] = i;
    }
    
    var j = 0;
    for (var i = 0; i < blockLength; i++) {
        j = (j + s[i] + key[i % keyLength]) % blockLength;
        //swap s[i] and s[j]
        s[i] ^= s[j];
        s[j] ^= s[i];
        s[i] ^= s[j];
    }
    
    this._s = s;
    this._i = 0;
    this._j = 0;
};

module.exports = Rc4Stream;


/////Test
/*
// TODO: Put this on mocha test
var k = new Buffer('12')
var cipher = Rc4Stream({key: k});
var decipher = Rc4Stream({key: k});
var name = "gabriel";
var Readable = require('stream').Readable;
var readable = Readable();
readable.push('gabriel');
readable.push(null);

var dest = fs.createWriteStream('/tmp/gabrielnode');

var x = readable.pipe(cipher).pipe(dest);
*/




