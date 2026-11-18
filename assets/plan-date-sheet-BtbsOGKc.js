import{c as r,r as n,j as e,B as d}from"./index-D_WMVE9f.js";import{D as i}from"./sliding-toggle-group-3L19U49q.js";import{S as h,a as x,b as m,c as p,d as k,L as u,e as y}from"./layout-DdxiWhbO.js";/**
 * @license lucide-react v0.544.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const f=[["path",{d:"M16 14v2.2l1.6 1",key:"fo4ql5"}],["path",{d:"M16 2v4",key:"4m81vk"}],["path",{d:"M21 7.5V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h3.5",key:"1osxxc"}],["path",{d:"M3 10h5",key:"r794hk"}],["path",{d:"M8 2v4",key:"1cmpym"}],["circle",{cx:"16",cy:"16",r:"6",key:"qoo3c4"}]],N=r("calendar-clock",f);/**
 * @license lucide-react v0.544.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const j=[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"m9 12 2 2 4-4",key:"dzmm74"}]],g=r("circle-check",j);function b({item:a,onOpenChange:c,onConfirm:o}){const[s,l]=n.useState("");return n.useEffect(()=>{a&&l(a.planned_date??"")},[a]),e.jsx(h,{open:a!=null,onOpenChange:t=>{t||c(!1)},children:e.jsxs(x,{children:[e.jsx(m,{children:e.jsx(p,{children:"Когда планируете купить?"})}),e.jsxs(k,{className:"space-y-4",children:[e.jsxs("p",{className:"text-sm leading-relaxed text-slate-500",children:["«",a?.name,"» переедет в «Запланировано» — периодически будем напоминать о ней на главном экране."]}),e.jsxs("div",{children:[e.jsx(u,{required:!0,children:"Период"}),e.jsx(i,{value:s,onChange:t=>l(t.target.value)})]})]}),e.jsxs(y,{className:"gap-2 sm:flex-col",children:[e.jsx(d,{className:"w-full",size:"lg",disabled:!s,onClick:()=>o(s),children:"Запланировать"}),e.jsx("button",{type:"button",className:"w-full py-2 text-center text-sm font-medium text-slate-400",onClick:()=>c(!1),children:"Отмена"})]})]})})}export{g as C,b as P,N as a};
//# sourceMappingURL=plan-date-sheet-BtbsOGKc.js.map
