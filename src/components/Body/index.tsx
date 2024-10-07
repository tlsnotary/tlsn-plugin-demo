import React, { ReactElement, useEffect, useState } from 'react';
import './index.scss';
import Steps from '../Steps';
import Icon from '../Icon';
import Logo from '../../../static/logo.svg';

const steps = ['Connect Extension', 'Install Plugin', 'Run Plugin'];

export default function Body(): ReactElement {
  return (
    <div className="w-full">
      <div className="flex flex-row w-full justify-center items-center gap-4 pb-12">
        <img className="w-12 h-12" src={Logo} alt="Logo" />
        <span className="font-bold text-slate-600 text-3xl">Plugin Demo</span>
      </div>
      <Steps />
    </div>
  );
}
