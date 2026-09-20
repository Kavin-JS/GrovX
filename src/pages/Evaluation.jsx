import { PageHead } from '../components/ui.jsx';
import { fmt } from '../utils/format.js';

const LOG2_PI4 = Math.log2(Math.PI / 4);

export default function Evaluation() {
  const keys = [64, 128, 192, 256];
  return (
    <>
      <PageHead title="Evaluation">
        What the implementation and measurements show about Grover's algorithm against classical search, and how much of
        the advantage survives contact with real hardware.
      </PageHead>

      <section>
        <h2>Findings</h2>
        <ol className="tight">
          <li><b>The circuit is correct.</b> The gate-level simulation matches the closed-form probability sin²((2k+1)θ) for every k, every n benchmarked, and for M = 1 and M &gt; 1 secret items (see the Benchmarks page and the automated tests).</li>
          <li><b>The query advantage is quadratic.</b> Queries fall from about N/2 to about 0.785·√N. At n = 20 that is roughly 524,000 against 804.</li>
          <li><b>The advantage is not exponential.</b> Grover's algorithm is provably optimal for unstructured search, so no quantum algorithm can do much better.</li>
          <li><b>Success is probabilistic.</b> Probability is high at the optimal k but below 100%, and it falls if k is too small or too large. The number of secret items must be known or estimated.</li>
          <li><b>Simulation is not speedup.</b> Simulator time grows exponentially with qubits and is far slower than a classical search. Only real quantum hardware could realise the query advantage.</li>
          <li><b>Depth and noise decide feasibility.</b> Qubits grow only linearly with n, but circuit length grows as n·√N. On noisy hardware the circuit fidelity collapses long before the query savings pay off.</li>
        </ol>
      </section>

      <section className="block">
        <h2>Comparison</h2>
        <div className="card scroll">
          <table className="text">
            <thead><tr><th>Factor</th><th>Classical search</th><th>Grover's algorithm</th></tr></thead>
            <tbody>
              <tr><td>Query complexity</td><td>O(N)</td><td>O(√N)</td></tr>
              <tr><td>Result</td><td>Deterministic</td><td>Probabilistic</td></tr>
              <tr><td>Memory / qubits</td><td>O(1) extra</td><td>n = log₂N qubits, plus ancillas</td></tr>
              <tr><td>Oracle</td><td>Any function call</td><td>Must be a reversible quantum circuit</td></tr>
              <tr><td>Parallelism</td><td>p machines give p× speedup</td><td>p machines give only √p× speedup</td></tr>
              <tr><td>Error sensitivity</td><td>Negligible</td><td>Very high: depth ∝ n√N</td></tr>
              <tr><td>Hardware today</td><td>Mature and cheap</td><td>Small and noisy</td></tr>
              <tr><td>Best-case advantage</td><td>None</td><td>Quadratic in queries, at large N and low error</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="block">
        <h2>Application: brute-force key search</h2>
        <p>
          Searching for a secret key given a yes/no check is exactly the problem studied here, with N = 2<sup>k</sup> for a k-bit key.
          Grover's algorithm effectively halves the key length in bits, which is why doubling symmetric key sizes is the usual advice.
        </p>
        <div className="card scroll">
          <table>
            <thead><tr><th>Key size</th><th>Classical average guesses</th><th>Grover iterations</th><th>Effective security</th></tr></thead>
            <tbody>
              {keys.map((k) => (
                <tr key={k}>
                  <td>{k} bits</td>
                  <td>2<sup>{k - 1}</sup></td>
                  <td>≈ 2<sup>{(k / 2 + LOG2_PI4).toFixed(1)}</sup></td>
                  <td>≈ {k / 2} bits</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="caption">
            Each Grover iteration also needs a full reversible circuit for the cipher, and iterations cannot be split across
            machines efficiently, so real attacks are far more expensive than the iteration count suggests. Figures are
            idealised.
          </p>
        </div>
      </section>

      <section className="block">
        <h2>Practical advantages</h2>
        <ul className="tight">
          <li>A genuine, proven reduction in oracle queries that applies to any unstructured search or constraint problem.</li>
          <li>Modest qubit requirements: log₂N data qubits, plus about n−2 ancillas if built from Toffoli gates.</li>
          <li>Amplitude amplification, the core idea, generalises and is used inside other quantum algorithms (counting, minimum finding, speeding up backtracking search).</li>
          <li>No special structure of the problem is required: only the ability to build the oracle.</li>
        </ul>
        <h2 style={{ marginTop: 24 }}>Limitations</h2>
        <ul className="tight">
          <li><b>Oracle cost.</b> Real checks (a hash, a cipher, a database lookup) become large reversible circuits, which can cost more than the queries saved. Loading a classical database into quantum memory costs at least N operations, which erases the advantage for database lookup.</li>
          <li><b>Noise.</b> The circuit is thousands to billions of gates deep at interesting sizes. Without error correction the output is random.</li>
          <li><b>Only quadratic.</b> Modest compared with the exponential speedups claimed for some other algorithms, and easy to lose to constant factors and slower gate speeds.</li>
          <li><b>Sequential structure.</b> The iterations must run one after another, so Grover parallelises poorly.</li>
          <li><b>Knowing when to stop.</b> Overshooting the optimal iteration count lowers success.</li>
        </ul>
      </section>

      <section className="block">
        <h2>Conclusion</h2>
        <div className="callout">
          <p>
            Grover's algorithm reduces oracle-query complexity from O(N) to O(√N), and this project confirms it by executing the
            circuit and measuring the behaviour. The advantage is real but quadratic, probabilistic, and expensive in circuit depth.
            On today's noisy machines it is not a practical win. Its value is as a foundation: a proven optimal method that becomes
            relevant once error-corrected quantum computers exist, and a reason to lengthen symmetric keys now.
          </p>
        </div>
      </section>

      <section className="block">
        <h2>Future scope</h2>
        <ul className="tight">
          <li>Run the same circuit on a cloud quantum device or a noisy simulator and measure the real drop in success probability.</li>
          <li>Quantum counting to estimate M, and fixed-point amplitude amplification to avoid overshooting.</li>
          <li>A real reversible oracle (for example a small hash or a SAT clause set) to measure true oracle cost.</li>
        </ul>
      </section>

      <section className="block">
        <h2>References</h2>
        <ol className="tight">
          <li>L. K. Grover, "A fast quantum mechanical algorithm for database search," Proc. 28th ACM STOC, 1996.</li>
          <li>C. H. Bennett, E. Bernstein, G. Brassard, U. Vazirani, "Strengths and weaknesses of quantum computing," SIAM J. Comput., 1997.</li>
          <li>M. Boyer, G. Brassard, P. Høyer, A. Tapp, "Tight bounds on quantum searching," Fortschritte der Physik, 1998.</li>
          <li>M. A. Nielsen, I. L. Chuang, <i>Quantum Computation and Quantum Information</i>, Cambridge University Press, chapter 6.</li>
        </ol>
      </section>
    </>
  );
}
