import{c as s,ar as l,as as h}from"./index-WRBlAuX3.js";import{a as u}from"./calculate-report-qlJ17Lut.js";/**
 * @license lucide-react v0.544.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const y=[["path",{d:"M8 2v4",key:"1cmpym"}],["path",{d:"M16 2v4",key:"4m81vk"}],["rect",{width:"18",height:"18",x:"3",y:"4",rx:"2",key:"1hopcy"}],["path",{d:"M3 10h18",key:"8toen8"}],["path",{d:"M8 14h.01",key:"6423bh"}],["path",{d:"M12 14h.01",key:"1etili"}],["path",{d:"M16 14h.01",key:"1gbofw"}],["path",{d:"M8 18h.01",key:"lrp35t"}],["path",{d:"M12 18h.01",key:"mhygvu"}],["path",{d:"M16 18h.01",key:"kzsmim"}]],p=s("calendar-days",y);/**
 * @license lucide-react v0.544.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const m=[["path",{d:"M12 15V3",key:"m9g1x1"}],["path",{d:"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4",key:"ih7n3h"}],["path",{d:"m7 10 5 5 5-5",key:"brsn70"}]],R=s("download",m);/**
 * @license lucide-react v0.544.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const f=[["path",{d:"M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8",key:"1357e3"}],["path",{d:"M3 3v5h5",key:"1xhq8a"}],["path",{d:"M12 7v5l4 2",key:"1fdv2h"}]],_=s("history",f);function c(e){const a=Math.max(0,e.remainder),t=u(a,e.rules,e.assets,e.usdRubRate).map(d=>({ruleId:d.ruleId,name:d.name,amountRub:d.amountRub,percent:a>0?d.amountRub/a*100:0})),o=t.reduce((d,n)=>d+n.percent,0);return{remainder:a,totalPercent:o,freePercent:Math.max(0,100-o),overBudget:o>100.05,slices:t}}function b(e){const a=e.excludeRuleId==null?e.rules:e.rules.filter(r=>r.id!==e.excludeRuleId);return c({...e,rules:a}).freePercent}function M(e){const a=e.draft.id==null?e.rules:e.rules.filter(t=>t.id!==e.draft.id),r={id:e.draft.id??-1,name:e.draft.name,rule_type:e.draft.rule_type,value:e.draft.value,currency:e.draft.currency,target_asset_id:e.draft.target_asset_id,sort_order:e.draft.sort_order,credit_early_repay_mode:e.draft.credit_early_repay_mode};return c({remainder:e.remainder,rules:[...a,r],assets:e.assets,usdRubRate:e.usdRubRate})}async function v(){const e=await l(),a=new Blob([e],{type:"application/json"}),r=URL.createObjectURL(a),t=document.createElement("a"),o=new Date().toISOString().slice(0,10);t.href=r,t.download=`monesto-backup-${o}.json`,document.body.appendChild(t),t.click(),t.remove(),URL.revokeObjectURL(r),await h()}export{p as C,R as D,_ as H,M as a,v as d,b as f,c as s};
//# sourceMappingURL=download-backup-CV_o3msu.js.map
