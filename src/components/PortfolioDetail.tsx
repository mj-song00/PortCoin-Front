import React, { useEffect, useState, useCallback } from 'react'
import '../css/PortfolioDtatil.css'
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Header from './Header';
import Side from './Side';
import Footer from './Footer';
import qs from 'qs';

// 서버에서 오는 실제 데이터 구조
interface ServerCoin {
  portfolioCoinId: number;
  id: number;
  symbol: string;
  name: string;
  amount: number;
  purchasePrice: number;
  currentPrice: number;
  change_24h: number;
  profitLoss?: number;
}

interface ServerPortfolioData {
  portfolioId: number;
  name: string;
  coins: ServerCoin[];
}

// 프론트엔드에서 사용할 데이터 구조
interface PortfolioData {
  coin: string;
  amount: number;
  percentage: number;
  profit: number | null;
  color: string;
  price: number;
  change24h: number;
}

interface PriceData {
  time: string;
  [key: string]: number | string;
}

interface ApiResponse<T> {
  statusCode: number;
  message: string;
  data?: T;
}

const PortfolioDetail: React.FC = () => {
  const { portfolioId } = useParams<{ portfolioId: string }>();
  console.log('PortfolioDetail 컴포넌트 마운트, useParams 결과:', { portfolioId });
  console.log('현재 URL:', window.location.pathname);
  
  const [portfolioData, setPortfolioData] = useState<PortfolioData[]>([]);
  const [priceData, setPriceData] = useState<PriceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [portfolioName, setPortfolioName] = useState<string>('');
  const [selectedCoin, setSelectedCoin] = useState<PortfolioData | null>(null);
  const [showCoinDetail, setShowCoinDetail] = useState(false);
  const { refreshAccessToken, isLoggedIn, isLoading } = useAuth();

  // 서버에서 포트폴리오 데이터 불러오기
  useEffect(() => {
    // portfolioId가 변경되면 loading 상태를 초기화
    if (portfolioId) {
      setLoading(true);
    }

    const fetchPortfolioData = async (change24hMap: { [symbol: string]: number } = {}): Promise<PortfolioData[] | null> => {
      if (!portfolioId) {
        return null;
      }
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) {
          return null;
        }

        const response = await axios.get<ApiResponse<ServerPortfolioData>>(
          `http://localhost:8080/api/v1/portfolio/${portfolioId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );
        
        if (response.data.data) {
          const serverData = response.data.data;
          setPortfolioName(serverData.name);

          // 전체 포트폴리오의 현재 가치 총합을 계산 (currentPrice 기준)
          const totalCurrentValue = serverData.coins.reduce((sum, coin) => {
            return sum + (coin.amount * coin.currentPrice);
          }, 0);

          const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3', '#54a0ff', '#5f27cd'];
      
          let convertedData: PortfolioData[] = serverData.coins.map((coin, index) => {
            const currentPrice = coin.currentPrice ?? coin.purchasePrice;
            const coinValue = coin.amount * currentPrice;
            const percentage = totalCurrentValue > 0 ? (coinValue / totalCurrentValue) * 100 : 0;
            const symbol = coin.symbol.toLowerCase();
            return {
              coin: coin.symbol,
              amount: coin.amount,
              percentage: parseFloat(percentage.toFixed(2)),
              profit: coin.profitLoss ?? 0,
              color: colors[index % colors.length],
              price: currentPrice,
              change24h: change24hMap[symbol] ?? coin.change_24h ?? 0 // 우선순위: API에서 받은 값 > 기존 값
            };
          });
          setPortfolioData(convertedData);
          return convertedData;
        }
        return null;
      } catch (error: any) {
        
        if (error.response?.status === 401) {
          try {
            await refreshAccessToken();
            return await fetchPortfolioData(); // 토큰 갱신 후 다시 시도
          } catch (refreshError) {
          
            // 로그인 페이지로 리다이렉트
            window.location.href = '/login';
            return null;
          }
        }
        
        // 에러 시 임시 데이터 사용
        console.log('에러로 인해 임시 데이터 사용 - 에러 타입:', error.name);
        const fallbackData = [
          { coin: 'BTC', amount: 0.5, percentage: 40, profit: 15.2, color: '#ff6b6b', price: 43250, change24h: 2.3 },
          { coin: 'ETH', amount: 2.0, percentage: 30, profit: 8.7, color: '#4ecdc4', price: 2650, change24h: -1.2 },
          { coin: 'ADA', amount: 1000, percentage: 20, profit: -5.3, color: '#45b7d1', price: 0.48, change24h: 5.8 },
          { coin: 'DOT', amount: 50, percentage: 10, profit: 12.1, color: '#96ceb4', price: 7.25, change24h: -0.8 },
        ];
        
        setPortfolioName("샘플 포트폴리오");
        setPortfolioData(fallbackData);
        return fallbackData;
      }
    };

    // 서버에서 시세 데이터 불러오기
    const fetchPriceData = async (portfolioCoins: PortfolioData[]) => {
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) {
          console.error("액세스 토큰이 없습니다.");
          return {};
        }

        // 각 코인에 대한 API 요청을 Promise 배열로 생성
        const priceRequests = portfolioCoins.map(coin => {
          const symbol = coin.coin.toLowerCase();
          const days = 1;
          return axios.post(
            'http://localhost:8080/api/v1/chart/history',
            { symbol, days },
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          ).then(response => ({
            symbol,
            prices: response.data.data.prices // 실제 데이터 구조 반영
          }));
        });

        // Promise.all로 모든 요청을 동시에 실행
        const responses = await Promise.all(priceRequests);

        // 각 코인별로 priceChangePercentage24h 값을 추출
        const change24hMap: { [symbol: string]: number } = {};
        responses.forEach(response => {
          const { symbol, prices } = response;
          if (Array.isArray(prices) && prices.length > 0) {
            change24hMap[symbol] = prices[0].priceChangePercentage24h ?? 0;
          }
        });

        // 기존 priceData 병합 로직 (차트용 데이터)
        const mergedPriceData: { [time: string]: { time: string, [key: string]: any } } = {};
        responses.forEach(response => {
          const { symbol, prices } = response;
          if (Array.isArray(prices)) {
            prices.forEach((entry: any) => {
              const { date, price } = entry;
              if (!mergedPriceData[date]) {
                mergedPriceData[date] = { time: date };
              }
              mergedPriceData[date][symbol] = price;
            });
          }
        });
        const finalPriceData = Object.values(mergedPriceData);
        setPriceData(finalPriceData);
        return change24hMap;
      } catch (error: any) {
        console.error("시세 데이터 로드 실패", error);
        
        if (error.response?.status === 401) {
          console.error("시세 데이터 인증 실패 - 토큰 갱신 시도");
          try {
            await refreshAccessToken();
            // 토큰 갱신 후 다시 시도
            const token = localStorage.getItem("accessToken");
            if (token) {
              const symbols = portfolioCoins.map(coin => coin.coin.toLowerCase());
              const days = 1;
              
              const response = await axios.post<ApiResponse<PriceData[]>>(
                'http://localhost:8080/api/v1/chart/history',
                { // 요청 본문 (body)
                  symbol: symbols,
                  days: days
                },
                { // axios config
                  headers: {
                    Authorization: `Bearer ${token}`,
                  }
                }
              );
              if (response.data.data) {
                setPriceData(response.data.data);
                return {};
              }
            }
          } catch (refreshError) {
            console.error("토큰 갱신 실패");
            window.location.href = '/login';
            return {};
          }
        }
        
        // 에러 시 임시 데이터 사용 - 포트폴리오에 있는 코인들만 포함
        console.log('임시 데이터 생성 - 포트폴리오 코인들:', portfolioCoins);
        const fallbackData = [
          { time: '00:00' }, { time: '02:00' }, { time: '04:00' }, { time: '06:00' },
          { time: '08:00' }, { time: '10:00' }, { time: '12:00' }, { time: '14:00' },
          { time: '16:00' }, { time: '18:00' }, { time: '20:00' }, { time: '22:00' },
          { time: '24:00' },
        ];
        
        // 포트폴리오에 있는 각 코인에 대해 임시 가격 데이터 추가
        portfolioCoins.forEach(coin => {
          // price는 이미 current_price 또는 purchase_price로 설정되어 있음
          const basePrice = coin.price; 
          console.log(`[TempData] 임시 데이터 생성 중: 코인=${coin.coin}, 기준 가격(basePrice)=${basePrice}, 타입=${typeof basePrice}`);

          fallbackData.forEach((data, index) => {
            const variation = (Math.random() - 0.5) * 0.1;
            const newPrice = basePrice * (1 + variation);
            if (isNaN(newPrice)) {
              console.error(`[TempData] 계산된 가격이 NaN입니다! basePrice=${basePrice}, variation=${variation}`);
            }
            (data as any)[coin.coin] = newPrice;
          });
        });
        
        console.log('생성된 임시 데이터:', fallbackData);
        setPriceData(fallbackData);
        return {};
      }
    };

    const loadData = async () => {
      console.log('loadData 시작, 현재 loading 상태:', loading);
      
      setLoading(true);
      console.log('loadData 시작');
      
      try {
        // 포트폴리오 데이터를 먼저 가져옴 (change24hMap 없이)
        const portfolioCoins = await fetchPortfolioData();
        console.log('loadData: fetchPortfolioData로부터 받은 데이터:', portfolioCoins);

        // 포트폴리오 데이터가 있으면 시세 데이터 가져오기
        if (portfolioCoins && portfolioCoins.length > 0) {
          console.log('포트폴리오 데이터 있음, 시세 데이터 가져오기 시작');
          const change24hMap = await fetchPriceData(portfolioCoins);
          await fetchPortfolioData(change24hMap); // change24hMap을 넘겨서 24h 변동 반영
        } else {
          console.log('포트폴리오 데이터가 없어서 시세 데이터 가져오기 건너뜀');
        }
      } catch (error) {
        console.error('loadData에서 에러 발생:', error);
      } finally {
        setLoading(false);
      }
    };

    // 로그인 상태가 확인되고 로그인된 경우에만 데이터 로드
    console.log('useEffect 조건 확인:', {
      isLoading,
      isLoggedIn,
      portfolioId,
      shouldLoadData: !isLoading && isLoggedIn && portfolioId
    });
    
    if (!isLoading && isLoggedIn && portfolioId) {
      console.log('loadData 호출 조건 만족 - loadData 실행');
      loadData();
    } else if (!isLoading && !isLoggedIn) {
      console.log('로그인되지 않음 - 로그인 페이지로 리다이렉트');
      // 로그인되지 않은 경우 로그인 페이지로 리다이렉트
      // 단, isLoading이 true일 때는 리다이렉트하지 않음 (토큰 확인 중)
  
      window.location.href = '/login';
    } else {
      console.log('loadData 호출 조건 불만족:', {
        isLoading,
        isLoggedIn,
        portfolioId
      });
    }
    // isLoading이 true일 때는 아무것도 하지 않음 (토큰 확인 대기)
  }, [isLoggedIn, isLoading, portfolioId]);

  // 렌더링 시점에 데이터 상태 확인
  useEffect(() => {
    console.log('PortfolioDetail 렌더링 상태:', {
      loading,
      isLoggedIn,
      isLoading,
      portfolioId,
      portfolioDataLength: portfolioData.length,
      priceDataLength: priceData.length,
      portfolioName
    });
  }, [loading, portfolioData, priceData, isLoggedIn, isLoading, portfolioId, portfolioName]);

  // 로딩 중일 때 표시할 내용
  if (loading) {
    console.log('로딩 중 렌더링');
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
        <Header />
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          <Side />
          <div className='portfolio-detail-container' style={{ flex: 1, overflow: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              <div>로딩 중...</div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // 데이터가 없을 때 표시할 내용
  if (portfolioData.length === 0) {
    console.log('데이터 없음 렌더링');
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
        <Header />
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          <Side />
          <div className='portfolio-detail-container' style={{ flex: 1, overflow: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              <div>포트폴리오 데이터를 불러올 수 없습니다.</div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // conic-gradient 문자열 생성
  const createConicGradient = () => {
    let currentAngle = 0;
    const gradientStops = portfolioData.map(item => {
      const startAngle = currentAngle;
      const endAngle = currentAngle + (item.percentage / 100) * 360;
      currentAngle = endAngle;
      return `${item.color} ${startAngle}deg ${endAngle}deg`;
    });
    return `conic-gradient(${gradientStops.join(', ')})`;
  };

  // 퍼센티지 라벨 위치 계산
  const getLabelPosition = (index: number) => {
    let currentAngle = 0;
    for (let i = 0; i < index; i++) {
      currentAngle += (portfolioData[i].percentage / 100) * 360;
    }
    const centerAngle = currentAngle + (portfolioData[index].percentage / 100) * 360 / 2;
    const radius = 60; // 라벨 위치 (원의 반지름보다 작게)
    
    const x = Math.cos((centerAngle - 90) * Math.PI / 180) * radius;
    const y = Math.sin((centerAngle - 90) * Math.PI / 180) * radius;
    
    return { x, y };
  };

  // 가격 포맷팅 함수
  const formatPrice = (price: number) => {
    // toLocaleString을 사용하여 천 단위 구분 기호를 추가하되,
    // maximumFractionDigits 옵션으로 소수점이 반올림되지 않도록 합니다.
    return `₩${(price ?? 0).toLocaleString('ko-KR', { maximumFractionDigits: 20 })}`;
  };

  // 코인 클릭 핸들러
  const handleCoinClick = (coin: PortfolioData) => {
    setSelectedCoin(coin);
    setShowCoinDetail(true);
  };

  // 코인 상세 모달 닫기
  const closeCoinDetail = () => {
    setShowCoinDetail(false);
    setSelectedCoin(null);
  };

  // 선택된 코인만 표시하는 선그래프 생성 함수
  const createSelectedCoinChart = () => {
    console.log('createSelectedCoinChart 호출됨:', {
      selectedCoin,
      priceDataLength: priceData.length,
      priceDataSample: priceData.length > 0 ? priceData[0] : null
    });

    if (!selectedCoin || priceData.length === 0) {
      return <div>차트 데이터가 없습니다.</div>;
    }

    const chartWidth = 700; // 너비 증가
    const chartHeight = 250; // 높이 증가
    const padding = 60; // 패딩 증가
    const graphWidth = chartWidth - 2 * padding;
    const graphHeight = chartHeight - 2 * padding;

    // 선택된 코인의 가격 데이터만 추출
    const coinKey = selectedCoin.coin as keyof typeof priceData[0];
    const coinPrices = priceData.map(data => {
      const price = data[coinKey] as number;
      return typeof price === 'number' && !isNaN(price) ? price : null;
    }).filter(price => price !== null) as number[];

    if (coinPrices.length === 0) {
      console.log(`'${selectedCoin.coin}'에 대한 유효한 가격 데이터가 없습니다.`);
      return <div>유효한 가격 데이터가 없습니다.</div>;
    }

    const minPrice = Math.min(...coinPrices);
    const maxPrice = Math.max(...coinPrices);
    const priceRange = maxPrice - minPrice;

    // Y축 스케일 함수
    const getY = (price: number) => {
      if (typeof price !== 'number' || isNaN(price)) {
        return chartHeight - padding; // 기본값
      }
      return chartHeight - padding - ((price - minPrice) / priceRange) * graphHeight;
    };

    // X축 스케일 함수
    const getX = (index: number) => {
      return padding + (index / (priceData.length - 1)) * graphWidth;
    };

    return (
      <svg width={chartWidth} height={chartHeight} className="line-chart">
        {/* 배경 그리드 */}
        {[0, 1, 2, 3, 4].map(i => (
          <line
            key={`grid-${i}`}
            x1={padding}
            y1={padding + (i * graphHeight) / 4}
            x2={chartWidth - padding}
            y2={padding + (i * graphHeight) / 4}
            stroke="#e9ecef"
            strokeWidth="1"
          />
        ))}

        {/* Y축 라벨 */}
        {[0, 1, 2, 3, 4].map(i => {
          const price = minPrice + (i * priceRange) / 4;
          return (
            <text
              key={`y-label-${i}`}
              x={padding - 15} // Y축 라벨 위치 조정
              y={padding + (i * graphHeight) / 4 + 4}
              textAnchor="end"
              fontSize="12" // 폰트 크기 증가
              fill="#6c757d"
            >
              {formatPrice(price)}
            </text>
          );
        })}

        {/* X축 라벨 */}
        {priceData.map((data, index) => (
          <text
            key={`x-label-${index}`}
            x={getX(index)}
            y={chartHeight - padding + 20} // X축 라벨 위치 조정
            textAnchor="middle"
            fontSize="10"
            fill="#6c757d"
          >
            {data.time}
          </text>
        ))}

        {/* 선택된 코인의 선그래프 */}
        <g>
          <polyline
            points={priceData.map((data, index) => {
              const price = data[coinKey] as number;
              const x = getX(index);
              const y = getY(price);
              return `${x},${y}`;
            }).join(' ')}
            fill="none"
            stroke={selectedCoin.color}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* 포인트 */}
          {priceData.map((data, index) => {
            const price = data[coinKey] as number;
            const x = getX(index);
            const y = getY(price);
            return (
              <circle
                key={`point-${index}`}
                cx={x}
                cy={y}
                r="4"
                fill={selectedCoin.color}
                stroke="white"
                strokeWidth="2"
              />
            );
          })}
        </g>
      </svg>
    );
  };

  // 모든 코인을 보여주는 선그래프 생성 함수
  const createLineChart = () => {
    console.log('createLineChart 호출됨:', {
      priceDataLength: priceData.length,
      portfolioDataLength: portfolioData.length,
      priceDataKeys: priceData.length > 0 ? Object.keys(priceData[0]) : [],
      portfolioDataCoins: portfolioData.map(c => c.coin)
    });

    if (priceData.length === 0 || portfolioData.length === 0) {
      console.log('차트 데이터가 없음 - priceData 또는 portfolioData가 비어있음');
      return <div>차트 데이터가 없습니다.</div>;
    }

    const chartWidth = 700;
    const chartHeight = 250;
    const padding = 60;
    const graphWidth = chartWidth - 2 * padding;
    const graphHeight = chartHeight - 2 * padding;

    // 모든 코인의 가격 데이터를 수집하여 최소/최대값 계산
    const allPrices: number[] = [];
    portfolioData.forEach(coin => {
      const coinKey = coin.coin;
      console.log(`[Chart] '${coinKey}' 코인의 가격을 찾는 중...`);

      priceData.forEach((data, index) => {
        // 첫 번째 데이터 항목에 대해서만 키와 값을 로그로 남겨 확인
        if (index === 0) {
          console.log(`[Chart] 임시 데이터 키:`, Object.keys(data));
          console.log(`[Chart] '${coinKey}' 키로 찾은 값:`, data[coinKey]);
        }
        
        const price = data[coinKey] as number;
        if (typeof price === 'number' && !isNaN(price)) {
          allPrices.push(price);
        }
      });
    });

    if (allPrices.length === 0) {
      console.log('유효한 가격 데이터가 없어 차트를 그릴 수 없습니다.', {
        portfolioData: portfolioData.map(c => c.coin),
        priceDataKeys: priceData.length > 0 ? Object.keys(priceData[0]) : []
      });
      return <div>가격 데이터가 유효하지 않아 차트를 표시할 수 없습니다.</div>;
    }

    const minPrice = Math.min(...allPrices);
    const maxPrice = Math.max(...allPrices);
    const priceRange = maxPrice - minPrice;

    // Y축 스케일 함수
    const getY = (price: number) => {
      if (typeof price !== 'number' || isNaN(price)) {
        return chartHeight - padding; // 기본값
      }
      return chartHeight - padding - ((price - minPrice) / priceRange) * graphHeight;
    };

    // X축 스케일 함수
    const getX = (index: number) => {
      return padding + (index / (priceData.length - 1)) * graphWidth;
    };

    return (
      <svg width={chartWidth} height={chartHeight} className="line-chart">
        {/* 배경 그리드 */}
        {[0, 1, 2, 3, 4].map(i => (
          <line
            key={`grid-${i}`}
            x1={padding}
            y1={padding + (i * graphHeight) / 4}
            x2={chartWidth - padding}
            y2={padding + (i * graphHeight) / 4}
            stroke="#e9ecef"
            strokeWidth="1"
          />
        ))}

        {/* Y축 라벨 */}
        {[0, 1, 2, 3, 4].map(i => {
          const price = minPrice + (i * priceRange) / 4;
          return (
            <text
              key={`y-label-${i}`}
              x={padding - 15}
              y={padding + (i * graphHeight) / 4 + 4}
              textAnchor="end"
              fontSize="12"
              fill="#6c757d"
            >
              {formatPrice(price)}
            </text>
          );
        })}

        {/* X축 라벨 */}
        {priceData.map((data, index) => (
          <text
            key={`x-label-${index}`}
            x={getX(index)}
            y={chartHeight - padding + 20}
            textAnchor="middle"
            fontSize="10"
            fill="#6c757d"
          >
            {data.time}
          </text>
        ))}

        {/* 선그래프 */}
        {portfolioData.map((coin, coinIndex) => {
          const coinKey = coin.coin as keyof typeof priceData[0];
          console.log(`선그래프 렌더링 - 코인: ${coin.coin}, 키: ${coinKey}`);
          
          const points = priceData.map((data, index) => {
            const price = data[coinKey] as number;
            const x = getX(index);
            const y = getY(price);
            return `${x},${y}`;
          }).join(' ');

          return (
            <g key={coin.coin}>
              <polyline
                points={points}
                fill="none"
                stroke={coin.color}
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* 포인트 */}
              {priceData.map((data, index) => {
                const price = data[coinKey] as number;
                const x = getX(index);
                const y = getY(price);
                return (
                  <circle
                    key={`point-${coin.coin}-${index}`}
                    cx={x}
                    cy={y}
                    r="4"
                    fill={coin.color}
                    stroke="white"
                    strokeWidth="2"
                  />
                );
              })}
            </g>
          );
        })}
      </svg>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <Header />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Side />
        <div className='portfolio-detail-container' style={{ flex: 1, overflow: 'auto' }}>
          <div style={{ padding: '20px' }}>
            <h1>{portfolioName}</h1>
            
            {/* 포트폴리오 분포 차트 */}
            <div style={{ marginBottom: '30px' }}>
              <h2>포트폴리오 분포</h2>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <div style={{ position: 'relative', width: '200px', height: '200px' }}>
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      borderRadius: '50%',
                      background: createConicGradient(),
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      width: '80px',
                      height: '80px',
                      borderRadius: '50%',
                      backgroundColor: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '14px',
                      fontWeight: 'bold',
                    }}
                  >
                    총 {portfolioData.length}개
                  </div>
                </div>
              </div>
            </div>

            {/* 코인 목록 테이블 */}
            <div style={{ marginBottom: '30px' }}>
              <h2>보유 코인</h2>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8f9fa' }}>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>코인</th>
                    <th style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #dee2e6' }}>보유량</th>
                    <th style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #dee2e6' }}>비중</th>
                    <th style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #dee2e6' }}>수익률</th>
                    <th style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #dee2e6' }}>현재가</th>
                    <th style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #dee2e6' }}>24h 변동</th>
                  </tr>
                </thead>
                <tbody>
                  {portfolioData.map((coin, index) => (
                    <tr
                      key={`${coin.coin}-${index}`}
                      onClick={() => handleCoinClick(coin)}
                      style={{
                        cursor: 'pointer',
                        transition: 'background-color 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#f8f9fa';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'white';
                      }}
                    >
                      <td style={{ padding: '12px', borderBottom: '1px solid #dee2e6' }}>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <span style={{ width: '10px', height: '10px', backgroundColor: coin.color, borderRadius: '50%', marginRight: '10px' }}></span>
                          <span>{coin.coin.toUpperCase()}</span>
                        </div>
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #dee2e6' }}>{coin.amount ?? 0}</td>
                      <td style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #dee2e6' }}>
                        {(coin.percentage ?? 100) === 100 
                          ? '100%' 
                          : `${(coin.percentage ?? 0).toFixed(2)}%`}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #dee2e6' }}>
                        {coin.profit === null ? (
                          <span style={{ color: '#888' }}>계산 실패</span>
                        ) : (
                          <span style={{ color: (coin.profit ?? 0) >= 0 ? '#28a745' : '#dc3545' }}>
                            {(coin.profit ?? 0) >= 0 ? '+' : ''}{(coin.profit ?? 0).toFixed(2)}%
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #dee2e6' }}>
                        {formatPrice(coin.price ?? 0)}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #dee2e6' }}>
                        <span style={{ color: (coin.change24h ?? 0) >= 0 ? '#28a745' : '#dc3545' }}>
                          {(coin.change24h ?? 0) >= 0 ? '+' : ''}{(coin.change24h ?? 0).toFixed(2)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 가격 차트 */}
            <div>
              <h2>24시간 가격 변동</h2>
              {selectedCoin ? (
                <div>
                  <div style={{ marginBottom: '10px' }}>
                    <button
                      onClick={closeCoinDetail}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                      }}
                    >
                      전체 보기
                    </button>
                    <span style={{ marginLeft: '10px' }}>{selectedCoin.coin} 선택됨</span>
                  </div>
                  {createSelectedCoinChart()}
                </div>
              ) : (
                createLineChart()
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default PortfolioDetail