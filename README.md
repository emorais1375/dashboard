# dashboard

## To Use

To clone and run this repository you'll need [Git](https://git-scm.com) and [Node.js](https://nodejs.org/en/download/) (which comes with [npm](http://npmjs.com)) installed on your computer. From your command line:

```bash
# Clone this repository
git clone https://github.com/emorais1375/dashboard
# Go into the repository
cd dashboard
# Install dependencies
yarn
# Run the app
yarn start
```

##### Development
* Run `yarn dev` to start webpack-dev-server. Electron will launch automatically after compilation.

##### Production
_You have two options, an automatic build or two manual steps_

###### One Shot
* Run `yarn package` to have webpack compile your application into `dist/bundle.js` and `dist/index.html`, and then an electron-packager run will be triggered for the current platform/arch, outputting to `builds/`

###### Manual
_Recommendation: Update the "postpackage" script call in package.json to specify parameters as you choose and use the `yarn package` command instead of running these steps manually_
* Run `yarn build` to have webpack compile and output your bundle to `dist/bundle.js`
* Then you can call electron-packager directly with any commands you choose

If you want to test the production build (In case you think Babili might be breaking something) after running `yarn build` you can then call `yarn prod`. This will cause electron to load off of the `dist/` build instead of looking for the webpack-dev-server instance. Electron will launch automatically after compilation.

Note: If you're using Linux Bash for Windows, [see this guide](https://www.howtogeek.com/261575/how-to-run-graphical-linux-desktop-applications-from-windows-10s-bash-shell/) or use `node` from the command prompt.