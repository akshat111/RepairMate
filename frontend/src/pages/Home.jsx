import Navbar from '../components/Navbar/Navbar';
import HeroSection from '../components/HeroSection/HeroSection';
import BookingForm from '../components/BookingForm/BookingForm';
import HowItWorks from '../components/HowItWorks/HowItWorks';
import DevicesSection from '../components/DevicesSection/DevicesSection';
import TrustSection from '../components/TrustSection/TrustSection';
import ReviewsSection from '../components/ReviewsSection/ReviewsSection';
import CTASection from '../components/CTASection/CTASection';
import Footer from '../components/Footer/Footer';

const Home = () => {
    return (
        <>
            <Navbar />
            <HeroSection />
            <BookingForm />
            <HowItWorks />
            <DevicesSection />
            <TrustSection />
            <ReviewsSection />
            <CTASection />
            <Footer />
        </>
    );
};

export default Home;
