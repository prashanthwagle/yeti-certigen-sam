const templates = {
  "Template-1": {
    markup: `       <div class="certificate">
                        <div style="width:800px; height:600px; padding:20px; text-align:center; border: 10px solid #787878">
                        <div style="width:750px; height:550px; padding:20px; text-align:center; border: 5px solid #787878">
                              <span style="font-size:50px; font-weight:bold">Template-1</span>
                              <br><br>
                              <span style="font-size:25px"><i>This is to certify that</i></span>
                              <br><br>
                              <span style="font-size:30px"><b>
                                <div class='name'>$NAME$</div>
                              </b></span><br/><br/>
                              <span style="font-size:25px"><i>has completed the course</i></span> <br/><br/>
                              <span style="font-size:30px"><div class='title'>$TITLE$</div></span> <br/><br/>
                              <span style="font-size:20px">with score of <b><div class='score'>$SCORE$</div></b></span> <br/><br/><br/><br/>
                              <span style="font-size:25px"><i>dated</i></span><br>
                              <span style="font-size:30px"><div class='doc'>$DOC$</div></span>
                        </div>
                        </div>
                    </div>`,
    fields: ["name", "title", "score", "doc"],
  },
};

module.exports = {
  templates,
};
