import * as React from 'react';
import Container from '@material-ui/core/Container';
import Typography from '@material-ui/core/Typography';
import { FormattedMessage } from "react-intl";

import SongsTable from "./tableNotPlayed";

import Grid from '@material-ui/core/Grid';
import FormLabel from '@material-ui/core/FormLabel';
import FormControl from '@material-ui/core/FormControl';
import FormGroup from '@material-ui/core/FormGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';

import TextField from '@material-ui/core/TextField';

import {songData} from "../../../../types/data";
import { _prefix, _prefixFromNum, difficultyDiscriminator } from '../../../../components/songs/filter';

import equal from 'fast-deep-equal'
import { _isSingle } from '../../../../components/settings';

interface stateInt {
  filterByName:string,
  songData:songData[],
  options:{[key:string]:string[]},
  sort:number,
  isDesc:boolean,
}

interface P{
  title:string,
  full:songData[],
  updateScoreData:()=>Promise<void>,
}

export default class NotPlayList extends React.Component<P,stateInt> {

  constructor(props:P){
    super(props);
    this.state = {
      filterByName:"",
      songData:[],
      sort:1,
      isDesc:false,
      options:{
        level:["11","12"],
        difficulty:["0","1","2"],
      }
    }
    this.updateScoreData = this.updateScoreData.bind(this);
  }

  componentDidMount(){
    this.setState({songData:this.songFilter()})
  }

  componentDidUpdate(prevProps:P){
    if(!equal(prevProps.full,this.props.full)){
      return this.setState({songData:this.songFilter()});
    }
  }

  updateScoreData():Promise<void>{
    return this.props.updateScoreData();
  }

  handleLevelChange = (name:string) => (e:React.ChangeEvent<HTMLInputElement>) =>{
    this.handleExec(name,e.target.checked,"level");
  }

  handleDiffChange = (name:string) => (e:React.ChangeEvent<HTMLInputElement>) =>{
    this.handleExec(name,e.target.checked,"difficulty");
  }

  handleExec = (name:string,checked:boolean,target:string)=>{
    let newState = this.state;
    if(checked){
      newState["options"][target].push(name);
    }else{
      newState["options"][target] = newState["options"][target].filter((t:string)=> t !== name);
    }
    return this.setState({songData:this.songFilter(newState),options:newState["options"]});
  }

  handleInputChange = (e:React.ChangeEvent<HTMLInputElement>)=>{
    let newState = this.cloneState();
    newState.filterByName = e.target.value;

    return this.setState({songData:this.songFilter(newState),filterByName:e.target.value});
  }

  songFilter = (newState:{[s:string]:any} = this.state) =>{
    const diffs:string[] = ["hyper","another","leggendaria"];
    return this.props.full.filter((data)=>{
      return (
        newState["options"]["level"].some((item:string)=>{
          return item === data.difficultyLevel }) &&
        newState["options"]["difficulty"].some((item:number)=>{
          return diffs[Number(item)] === difficultyDiscriminator(data.difficulty)} ) &&
        data.title.indexOf(newState["filterByName"]) > -1
      )
    })
  }

  changeSort = (newNum:number):void=>{
    const {sort,isDesc} = this.state;
    if(sort === newNum){
      return this.setState({isDesc:!isDesc});
    }
    return this.setState({sort:newNum,isDesc:true})
  }

  sortedData = ():songData[]=>{
    const {songData,sort,isDesc} = this.state;
    const res = songData.sort((a,b)=> {
      switch(sort){
        case 0:
        return Number(b.difficultyLevel) - Number(a.difficultyLevel);
        case 1:
        default:
        return b.title.localeCompare(a.title, "ja", {numeric:true});
      }
    });
    return isDesc ? res : res.reverse();
  }

  // readonly修飾子が付いているデータに一時的な書き込みをするための措置
  // (曲目フィルタのためにのみ使用し、stateには反映しない)
  // アンチパターンなのでなんとかする
  cloneState = () => JSON.parse(JSON.stringify(this.state))

  render(){
    const {filterByName,options,sort,isDesc} = this.state;
    return (
      <Container className="commonLayout" fixed id="songsVil">
        <Typography component="h4" variant="h4" color="textPrimary" gutterBottom
          style={{display:"flex",justifyContent:"space-between"}}>
          <FormattedMessage id={this.props.title}/>
        </Typography>
        <Grid container spacing={1} style={{margin:"5px 0"}}>
          <Grid item xs={12}>
            <form noValidate autoComplete="off">
              <TextField
                style={{width:"100%"}}
                label={<FormattedMessage id="Songs.filterByName"/>}
                placeholder={"(ex.)255"}
                value={filterByName}
                onChange={this.handleInputChange}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </form>
          </Grid>
        </Grid>
        <Grid container spacing={1} id="mainFilters" style={{margin:"5px 0"}}>
          <Grid item xs={6}>
            <FormControl component="fieldset">
              <FormLabel component="legend"><FormattedMessage id="Songs.filterByLevel"/></FormLabel>
              <FormGroup row>
                <FormControlLabel
                  control={<Checkbox checked={options.level.some(t=> t === "11")} onChange={this.handleLevelChange("11")} value="11" />}
                  label="☆11"
                />
                <FormControlLabel
                  control={<Checkbox checked={options.level.some(t=> t === "12")} onChange={this.handleLevelChange("12")} value="12" />}
                  label="☆12"
                />
              </FormGroup>
            </FormControl>
          </Grid>
          <Grid item xs={6}>
            <FormControl component="fieldset">
              <FormLabel component="legend"><FormattedMessage id="Songs.filterByDifficulty"/></FormLabel>
              <FormGroup row>
                <FormControlLabel
                  control={<Checkbox checked={options.difficulty.some(t=> t === "0")} onChange={this.handleDiffChange("0")} value="hyper" />}
                  label="H"
                />
                <FormControlLabel
                  control={<Checkbox checked={options.difficulty.some(t=> t === "1")} onChange={this.handleDiffChange("1")} value="another" />}
                  label="A"
                />
                <FormControlLabel
                  control={<Checkbox checked={options.difficulty.some(t=> t === "2")} onChange={this.handleDiffChange("2")} value="leggendaria" />}
                  label="†"
                />
              </FormGroup>
            </FormControl>
          </Grid>
        </Grid>

        <SongsTable
          data={this.sortedData()} sort={sort} isDesc={isDesc}
          changeSort={this.changeSort}
          updateScoreData={this.updateScoreData}/>

      </Container>
    );
  }
}
