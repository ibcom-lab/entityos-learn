entityOS SDK Node.js Example app
==========================================

Node.js example app using the entityOS npm module.

> https://npmjs.org/package/entityos

> https://docs.entityos.cloud/gettingstarted_nodejs

Check out `learn.js` for code example (with comments) and `settings.json` to update the username & password used to authenicate for the mydigitalstructrue.cloud methods.

---

**Initialise:**

`var entityos = require('entityos');`

**Controller methods:**

`entityos.add({name:, note:, code:});`

`entityos.invoke(name, parameters for controller, data for controller);`


**Local data storage methods:**

`entityos.set({scope:, context:, name:, value:});`

`entityos.get({scope:, context:, name:});`


**Cloud data storage methods:**

`entityos.cloud.save({object:, data:, callback:});`

`entityos.cloud.retrieve({object:, data:, callback:});`

`entityos.cloud.invoke({object:, data:, callback:});`
