import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { BrandDrop } from '../components/icons';
import './Welcome.css';

const STEPS = [
  { number: '01', title: 'Create commitments', body: 'Define what you will do, and for how long.' },
  { number: '02', title: 'Track with a timer', body: 'Execute the work. Time is recorded automatically.' },
  { number: '03', title: 'Keep a permanent record', body: 'Every scheduled day is logged. History is never rewritten.' },
  { number: '04', title: 'See real progress', body: 'Factual completion and consistency — nothing gamified.' },
];

export default function Welcome() {
  const { updateSettings } = useApp();
  const navigate = useNavigate();

  async function start() {
    await updateSettings({ hasOnboarded: true });
    navigate('/today', { replace: true });
  }

  return (
    <div className="welcome-screen">
      <div className="welcome-card lens">
        <div className="welcome-head">
          <div className="welcome-orb" aria-hidden="true">
            <BrandDrop width={44} height={44} />
          </div>
          <h1 className="welcome-title display">THE ARCHITECT</h1>
          <p className="welcome-tagline accent">Build a better you</p>
        </div>

        <p className="welcome-copy">
          A focused system for keeping promises you make to yourself. Plan a commitment,
          execute it with a timer, and let the record speak for itself.
        </p>

        <ul className="welcome-steps stagger">
          {STEPS.map((step, i) => (
            <li key={step.title} className="welcome-step" style={{ ['--i' as string]: i + 2 }}>
              <span className="welcome-step-glyph mono" aria-hidden="true">
                {step.number}
              </span>
              <div>
                <div className="welcome-step-title serif">{step.title}</div>
                <div className="welcome-step-body">{step.body}</div>
              </div>
            </li>
          ))}
        </ul>

        <button type="button" className="btn btn-primary btn-block welcome-cta" onClick={start}>
          Start Building
        </button>

        <p className="welcome-footer label">Plan · Execute · Record · Repeat</p>
      </div>
    </div>
  );
}
