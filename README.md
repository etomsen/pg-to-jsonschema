##HOW TO BUILD

before building please comment in `node_modules/pg/lib/index.js` the following lines:

```js
    if(typeof process.env.NODE_PG_FORCE_NATIVE != 'undefined') {
    // module.exports = new PG(require('./native'));
    } else {
    module.exports = new PG(Client);

    //lazy require native module...the native module may not have installed
    // module.exports.__defineGetter__("native", function() {
    //   delete module.exports.native;
    //   var native = null;
    //   try {
    //     native = new PG(require('./native'));
    //   } catch (err) {
    //     if (err.code !== 'MODULE_NOT_FOUND') {
    //       throw err;
    //     }
    //     console.error(err.message);
    //   }
    //   module.exports.native = native;
    //   return native;
    // });
    }
```