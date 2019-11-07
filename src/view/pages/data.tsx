import * as React from 'react';
import Container from '@material-ui/core/Container';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import { FormattedMessage } from "react-intl";
import {scoresDB, scoreHistoryDB} from "../../components/indexedDB";
import TextField from '@material-ui/core/TextField';
import Divider from '@material-ui/core/Divider';
import Snackbar from '@material-ui/core/Snackbar';
import importCSV from "../../components/csv/import";
import bpiCalculator from "../../components/bpi";
import { _currentStore, _isSingle, _currentStoreWithFullName } from '../../components/settings';
import CircularProgress from '@material-ui/core/CircularProgress';
import Link from '@material-ui/core/Link';

export default class Index extends React.Component<{global:any},{raw:string,isSnackbarOpen:boolean,stateText:string,errors:string[],isSaving:boolean,currentState:string,progress:number}> {

  constructor(props:{global:any}){
    super(props);
    this.state = {
      raw: "",
      isSnackbarOpen:false,
      stateText:"Data.Success",
      errors:[],
      isSaving:false,
      currentState:"",
      progress:0,
    }
    this.execute = this.execute.bind(this);
  }

  async execute(){
    try{
      this.props.global.setMove(true);
      this.setState({isSaving:true});
      let errors = [];
      const executor = new importCSV(this.state.raw,_isSingle(),_currentStore());
      const calc = new bpiCalculator();
      const exec = await executor.execute();
      if(!exec){
        throw new Error("CSVデータの形式が正しくありません");
      }

      const result = executor.getResult(),resultHistory = executor.getResultHistory();
      const s = new scoresDB(_isSingle(),_currentStore()), h = new scoreHistoryDB();
      const all = await s.getAll().then(t=>t.reduce((result:any, current:any) => {
        result[current.title] = current;
        return result;
      }, {}));

      const len = result.length;
      for(let i = 0;i < len;++i){
        const calcData = await calc.calc(result[i]["title"],result[i]["difficulty"],result[i]["exScore"])
        if(calcData.error && calcData.reason){
          errors.push(result[i]["title"] + " - " + calcData.reason);
          continue;
        }
        if(all[result[i]["title"]] && (all[result[i]["title"]]["exScore"] >= result[i]["exScore"] && all[result[i]["title"]]["clearState"] === result[i]["clearState"])){
          //this.setState({progress:i / len * 100,currentState:result[i]["title"] + "をスキップしました"});
          continue;
        }
        //this.setState({progress:i / len * 100,currentState:result[i]["title"] + "を保存しています"});
        const body = Object.assign(
          result[i],
          {
            difficultyLevel:calcData.difficultyLevel,
            currentBPI : calcData.bpi,
            isImported: true,
            lastScore: all[result[i]["title"]] ? all[result[i]["title"]]["exScore"] : 0
          }
        );
        all[result[i]["title"]] ? s.setItem(body) : s.putItem(body);
        h.add(Object.assign(resultHistory[i],{difficultyLevel:calcData.difficultyLevel}),{currentBPI:calcData.bpi,exScore:resultHistory[i].exScore},true);
      }
      this.props.global.setMove(false);
      return this.setState({isSaving:false,raw:"",isSnackbarOpen:true,stateText:"Data.Success",errors:errors});
    }catch(e){
      this.props.global.setMove(false);
      return this.setState({isSaving:false,isSnackbarOpen:true,stateText:"Data.Failed",errors:[e.message]});
    }
  }

  onChangeText = (e: React.ChangeEvent<HTMLInputElement>)=> this.setState({raw:e.target.value});
  handleClose = ()=> this.setState({isSnackbarOpen:false});

  render(){
    const {raw,isSnackbarOpen,stateText,errors,isSaving} = this.state;
    return (
      <Container className="commonLayout" fixed>
        <Snackbar
          open={isSnackbarOpen}
          onClose={this.handleClose}
          ContentProps={{
            'aria-describedby': 'message-id',
          }}
          message={<span id="message-id"><FormattedMessage id={stateText}/></span>}
        />
        <Typography component="h4" variant="h4" color="textPrimary" gutterBottom>
          <FormattedMessage id="Data.add"/>
        </Typography>
        <Typography variant="body1" gutterBottom>
          <FormattedMessage id="Data.infoBulk"/><br/>
          <FormattedMessage id="Data.howToBulk1"/>
          <Link color="secondary" href={"https://p.eagate.573.jp/game/2dx/"+_currentStore()+"/djdata/score_download.html"} target="_blank" rel="noopener noreferrer">
            <FormattedMessage id="Data.CSVURL"/>
          </Link>
          <FormattedMessage id="Data.howToBulk2"/>
        </Typography>
        <TextField
          onChange={this.onChangeText}
          value={raw}
          style={{width:"100%"}}
          label="Paste here"
          margin="dense"
          variant="outlined"
          multiline
          rowsMax="4"/>
        <div style={{position:"relative"}}>
          <Button
            variant="contained"
            color="primary"
            onClick={this.execute}
            disabled={isSaving}
            style={{width:"100%",margin:"5px 0"}}>
            <FormattedMessage id="Data.Execute"/>
            (->{_currentStoreWithFullName() })
          </Button>
          {isSaving && <CircularProgress size={24} style={{color:"#777",position:"absolute",top:"50%",left:"50%",marginTop:-12,marginLeft:-12}} />}
        </div>
        {errors && errors.map(item=><span key={item}>{item}<br/></span>)}
        <Divider variant="middle" style={{margin:"10px 0"}}/>
        <FormattedMessage id="Data.notPremium1"/>
        <Divider variant="middle" style={{margin:"10px 0"}}/>
        <Typography component="h4" variant="h4" color="textPrimary" gutterBottom>
          <FormattedMessage id="Data.edit"/>
        </Typography>
        <FormattedMessage id="Data.howToEdit"/>
        <ol>
          <li><FormattedMessage id="Data.howToEdit1"/></li>
          <li><FormattedMessage id="Data.howToEdit2"/></li>
          <li><FormattedMessage id="Data.howToEdit3"/></li>
        </ol>
      </Container>
    );
  }
}
