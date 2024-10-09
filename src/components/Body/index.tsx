import React, { ReactElement, useEffect, useState } from 'react';
import './index.scss';
import Steps from '../Steps';
import Logo from '../../../static/logo.svg';

export default function Body(): ReactElement {
  return (
    <div className="w-full">
      <div className="flex flex-row w-full justify-center items-center gap-4 pb-12">
        <img className="w-11 h-11" src={Logo} alt="Logo" />
        <span className="font-bold text-slate-700 text-3xl">Plugin Demo</span>
      </div>
      <Steps />
    </div>
  );
}
