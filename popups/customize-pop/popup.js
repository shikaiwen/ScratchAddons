import WebsiteLocalizationProvider from "../../libraries/website-l10n.js";

(async () => {
  const l10n = new WebsiteLocalizationProvider();

  //theme
  const lightThemeLink = document.createElement("link");
  lightThemeLink.setAttribute("rel", "stylesheet");
  lightThemeLink.setAttribute("href", "light.css");

  chrome.storage.sync.get(["globalTheme"], function (r) {
    let rr = false; //true = light, false = dark
    if (r.globalTheme) rr = r.globalTheme;
    if (rr) {
      document.head.appendChild(lightThemeLink);
    }
  });

  await l10n.loadByAddonId("cloud-games");
  let codeStrInit = `
  Workspro_EN_Client/src/common/check/CommChecker.java
Workspro_EN_Client/src/components/c_AA0200/logic/Check.java
Workspro_EN_Client/src/components/c_AS_BA1700/logic/Check.java
Workspro_EN_Client/src/components/c_AS_BA1800/logic/Check.java
Workspro_EN_Client/src/components/c_AS_BB0300/listener/BtnOkListener.java
Workspro_EN_Client/src/components/c_AS_D_0400/logic/Check.java
Workspro_EN_Client/src/components/c_AS_D_0600/listener/BtnOkListener.java
Workspro_EN_Client/src/components/c_AS_D_1800/logic/Check.java
Workspro_EN_Client/src/components/c_AS_EA0500/listener/BtnOkListener.java
Workspro_EN_Client/src/components/c_BA0100/listener/BtnOkListener.java
Workspro_EN_Client/src/components/c_CA0100/logic/Check.java
Workspro_EN_Client/src/components/c_CA0300/c_CA0301/logic/Check.java
Workspro_EN_Client/src/components/c_DA9110/logic/Check.java
Workspro_EN_Client/src/components/c_ME1100/logic/Check.java

`;

  const vue = new Vue({
    el: "body",
    data: {
      projects: [],
      loaded: true,
      messages: { noUsersMsg: l10n.get("cloud-games/no-users") },
      projectsChecked: 0,
      codeStr: !localStorage.getItem("nowCode") ? codeStrInit :localStorage.getItem("nowCode") ,
      runResult:"1",
      codeTextArea:null

    },
    computed: {
      projectsSorted() {
        return this.projects.sort((b, a) => a.amt - b.amt);
      },
      loadingMsg() {
        return l10n.get("cloud-games/loading", { done: this.projectsChecked, amount: this.projects.length || "?" });
      },
    },
    methods: {
      setCloudDataForProject(projectObject, i) {
        return new Promise((resolve) => {
          setTimeout(async () => {
            const res = await fetch(
              `https://clouddata.scratch.mit.edu/logs?projectid=${projectObject.id}&limit=40&offset=0`
            );
            const json = await res.json();
            const dateNow = Date.now();
            const usersSet = new Set();
            for (const varChange of json) {
              if (dateNow - varChange.timestamp > 60000) break;
              usersSet.add(varChange.user);
            }
            projectObject.amt = usersSet.size;
            projectObject.users = Array.from(usersSet);
            this.projectsChecked++;
            if (this.projectsChecked / this.projects.length > 0.5) {
              // Show UI even tho it's not ready, if a majority of projects loaded
              this.loaded = true;
            }
            resolve();
          }, i * 125);
        });
      },
      saveCodeLocal(codeStr){
        localStorage.setItem("currentJsCode",codeStr);
      },
      getCodeLocal(){
        return localStorage.getItem("currentJsCode");
      },
      codeChange(){
        var nowCode = document.getElementById("codeData").value;
        localStorage.setItem("nowCode",nowCode)
        this.codeStr = nowCode;
      },
      btnRunClick(){

        var vueObj = this;
        let codeStr = this.codeTextArea.getValue();
        vueObj.saveCodeLocal(codeStr);
        if(codeStr){
        // function modifyDOM() {
        //     var fun = new Function(codeStr);
        //     return document;
        // }
        var functionInTab = `
        function(){
          var C = {
            log(data){
              this.result.push(data);
            },
            result:[]
          };
          try{
            ${codeStr};
          }catch(e){
            var errorStr = e.stack;
            console.log("error occured");
            C.log(errorStr);
          }
          return C;
        }
        `;
        //We have permission to access the activeTab, so we can call chrome.tabs.executeScript:
        // chrome.tabs.executeScript({
        //     code: '(' + modifyDOM + ')();' //argument here is a string but function.toString() returns function's code
        // }, (results) => {
            //Here we have just the innerHTML and not DOM structure
            // console.log('Popup script:')
            // console.log(results[0]);
        // });

        chrome.tabs.executeScript({
          code: '(' + functionInTab + ')();' //argument here is a string but function.toString() returns function's code
      }, (results) => {
          //Here we have just the innerHTML and not DOM structure
          // console.log(results[0]);
          var consoleInCtScript = results[0];
          if(consoleInCtScript){
            vueObj.runResult = consoleInCtScript.result.join("<br>");
          }
      });
          // const sum = new Function('a', 'b', 'return a  + b');
          // fun(Konsole);
          // var html = Konsole.result.join("<br>")
          // var result = eval(codeStr);
          // this.runResult = html;
        }
        // alert(codeStr)
      }
    },
    async created() {
// 404 442
      // document.title = l10n.get("cloud-games/popup-title");
      // const res = await fetch("https://api.scratch.mit.edu/studios/539952/projects/?limit=40");
      // const projects = await res.json();
      // // TODO: add currently opened game to projects array. Sort function should put it on top
      // this.projects = projects
      //   .map((project) => ({ title: project.title, id: project.id, amt: 0, users: [], extended: true }))
      //   .reverse();
      // await Promise.all(this.projects.map((project, i) => this.setCloudDataForProject(project, i)));

      let that = this;
      var initCode = localStorage.getItem("currentJsCode")
      this.$nextTick(()=>{
        var dat = initCode;
        var cm = CodeMirror(document.getElementById("editor"), {
          value: initCode,
          mode: "javascript",
          indentUnit: 4,
          lineNumbers: true
        });

        that.codeTextArea = cm;

      })



    },
  });
})();
