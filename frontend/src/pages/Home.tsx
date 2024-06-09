import Navbar from '../components/Navbar';
import BlogsList from '../components/BlogsList';
import Hero from '../components/Hero';

const Home = () => {
  return (
    <div>
      <Navbar skipAuthCheck />
      <Hero />
      <BlogsList />
    </div>
  );
};

export default Home;
